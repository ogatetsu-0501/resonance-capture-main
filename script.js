// ここでは 3.0.0-beta2 の「dist.es5+esm/index.mjs」を直接読み込みます
// これで「decode」や「encode」などがモジュールとして使えます
import {
  decode,
  encode,
} from "https://unpkg.com/@msgpack/msgpack@3.0.0-beta2/dist.es5+esm/index.mjs";

// スクリプトが正しく始まったか確認します
console.log("スクリプト開始！(ESM版)");

// 各種計算関数の定義

// 総売上額を計算する関数
function calculateTotalSales(data) {
  return data.reduce((total, item) => {
    return total + item.値段 * item.販売個数;
  }, 0);
}

// 平均値段を計算する関数
function calculateAveragePrice(data) {
  const totalPrice = data.reduce((sum, item) => sum + item.値段, 0);
  return totalPrice / data.length;
}

// 売りと買いの商品の数をカウントする関数
function countSellBuy(data) {
  return data.reduce(
    (counts, item) => {
      if (item["売りor買い"] === "売り") {
        counts.sell += 1;
      } else if (item["売りor買い"] === "買い") {
        counts.buy += 1;
      }
      return counts;
    },
    { sell: 0, buy: 0 }
  );
}

// 特産品と通常品に分類する関数
function categorizeProducts(data) {
  return data.reduce(
    (categories, item) => {
      if (item["特産品"] === "特産品") {
        categories.special.push(item);
      } else {
        categories.normal.push(item);
      }
      return categories;
    },
    { special: [], normal: [] }
  );
}

// 最新の更新時間を取得する関数（各都市ごとに）
function getLatestUpdateTimePerCity(cityDataMap, specifiedTime = new Date()) {
  const latestTimeMap = new Map();

  cityDataMap.forEach((data, city) => {
    const latestTime = data.reduce((latest, item) => {
      const itemDate = new Date(item.更新時間.replace(" ", "T")); // 日付形式の調整
      if (itemDate <= specifiedTime && itemDate > latest) {
        return itemDate;
      }
      return latest;
    }, new Date(0)); // 初期値を1970-01-01に設定

    latestTimeMap.set(city, latestTime);
  });

  return latestTimeMap;
}

// ユニークな都市名リストを作成する関数
function getUniqueCityList(data) {
  const citySet = new Set(data.map((item) => item.都市名));
  return Array.from(citySet);
}

// 各都市ごとにデータを整形する関数
function restructureDataByCity(data) {
  const cityMap = new Map();
  data.forEach((item) => {
    if (!cityMap.has(item.都市名)) {
      cityMap.set(item.都市名, []);
    }
    cityMap.get(item.都市名).push(item);
  });
  return cityMap;
}

// HTMLに都市名リストを表示する関数
function displayCityList(cityList) {
  const cityListElement = document.getElementById("city-list");
  cityListElement.innerHTML = ""; // 初期化
  cityList.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    cityListElement.appendChild(li);
  });
}

// HTMLに各都市のデータを表示する関数
function displayCityData(latestTimeMap, cityDataMap, cityList, specifiedTime) {
  const cityDataElement = document.getElementById("city-data");
  cityDataElement.innerHTML = ""; // 初期化

  cityList.forEach((city) => {
    const citySection = document.createElement("section");
    const cityHeader = document.createElement("h4");
    cityHeader.textContent = city;
    citySection.appendChild(cityHeader);

    const data = cityDataMap.get(city);
    if (!data) {
      citySection.innerHTML += "<p>データなし</p>";
      cityDataElement.appendChild(citySection);
      return;
    }

    // 各都市の最新更新時間を取得
    const latestTime = latestTimeMap.get(city);
    if (latestTime.getTime() === new Date(0).getTime()) {
      citySection.innerHTML += "<p>指定した時間以前のデータがありません</p>";
      cityDataElement.appendChild(citySection);
      return;
    }

    // "都市時間"を表示
    const timePara = document.createElement("p");
    timePara.textContent = `都市時間: ${latestTime.toLocaleString()}`;
    citySection.appendChild(timePara);

    // "フィルタ済都市データ"を取得
    const filteredCityData = data.filter((item) => {
      const itemDate = new Date(item.更新時間.replace(" ", "T"));
      return itemDate.getTime() === latestTime.getTime();
    });

    // "都市売りデータ"と"都市買いデータ"を取得
    const citySellData = filteredCityData.filter(
      (item) => item["売りor買い"] === "売り"
    );
    const cityBuyData = filteredCityData.filter(
      (item) => item["売りor買い"] === "買い"
    );

    // 売りデータを表示
    const sellHeader = document.createElement("h5");
    sellHeader.textContent = "売りデータ";
    citySection.appendChild(sellHeader);
    if (citySellData.length > 0) {
      const sellList = document.createElement("ul");
      citySellData.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.商品名}: 値段=${item.値段}, 販売個数=${item.販売個数}`;
        sellList.appendChild(li);
      });
      citySection.appendChild(sellList);
    } else {
      const noSell = document.createElement("p");
      noSell.textContent = "売りデータなし";
      citySection.appendChild(noSell);
    }

    // 買いデータを表示
    const buyHeader = document.createElement("h5");
    buyHeader.textContent = "買いデータ";
    citySection.appendChild(buyHeader);
    if (cityBuyData.length > 0) {
      const buyList = document.createElement("ul");
      cityBuyData.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.商品名}: 値段=${item.値段}, 販売個数=${item.販売個数}`;
        buyList.appendChild(li);
      });
      citySection.appendChild(buyList);
    } else {
      const noBuy = document.createElement("p");
      noBuy.textContent = "買いデータなし";
      citySection.appendChild(noBuy);
    }

    // 都市データをセクションに追加
    cityDataElement.appendChild(citySection);
  });
}

// 更新ボタンがクリックされたときの処理
document.getElementById("update-time").addEventListener("click", () => {
  const timeInput = document.getElementById("specified-time").value;
  const specifiedTime = timeInput ? new Date(timeInput) : new Date();

  // 各都市のデータをHTMLに表示
  displayCityData(
    globalLatestTimeMap,
    globalCityDataMap,
    globalCityList,
    specifiedTime
  );
});

// グローバルな変数として都市データと最新更新時間を保持
let globalCityDataMap = new Map();
let globalCityList = [];
let globalLatestTimeMap = new Map();

// データ取得後の処理
fetch("./価格/market_data.msgpack")
  // ファイルが取れたら、バイナリデータ(arrayBuffer)として受け取ります
  .then((response) => {
    console.log("fetch応答ステータス:", response.status);
    return response.arrayBuffer();
  })
  // バイナリデータを実際に使います
  .then((arrayBuffer) => {
    // バイナリデータの大きさを表示します
    console.log("バイナリデータのサイズ:", arrayBuffer.byteLength);

    // バイナリデータをUint8Arrayという形式に変換します
    const uint8Array = new Uint8Array(arrayBuffer);

    // importした「decode」関数を呼び出して、MessagePackデータを解凍します
    const data = decode(uint8Array);

    // デコードした結果のオブジェクトや配列をコンソールに表示します
    console.log("MessagePackデコード結果:", data);

    // 見やすいようにJSON形式に変換して出力します
    console.log("JSON形式で見る:", JSON.stringify(data, null, 2));

    // 各種計算を実行
    const totalSales = calculateTotalSales(data);
    const averagePrice = calculateAveragePrice(data);
    const sellBuyCounts = countSellBuy(data);
    // latestUpdateTime は都市ごとに保持するためここでは使用しません

    // 計算結果をコンソールに表示
    console.log("総売上額:", totalSales);
    console.log("平均値段:", averagePrice.toFixed(2));
    console.log("売りの数:", sellBuyCounts.sell);
    console.log("買いの数:", sellBuyCounts.buy);
    // console.log("最新の更新時間:", latestUpdateTime); // 削除

    // 「都市名リスト」を作成
    const uniqueCityList = getUniqueCityList(data);
    console.log("都市名リスト:", uniqueCityList);
    globalCityList = uniqueCityList; // グローバル変数に保存

    // データを都市別に整形
    const cityDataMap = restructureDataByCity(data);
    console.log("都市別データ:", cityDataMap);
    globalCityDataMap = cityDataMap; // グローバル変数に保存

    // 各都市の最新更新時間を取得
    const latestTimeMap = getLatestUpdateTimePerCity(cityDataMap);
    console.log("各都市の最新更新時間:", latestTimeMap);
    globalLatestTimeMap = latestTimeMap; // グローバル変数に保存

    // デフォルトの指定時間は現在
    const specifiedTime = new Date();

    // 都市名リストをHTMLに表示
    displayCityList(uniqueCityList);

    // 各都市のデータをHTMLに表示
    displayCityData(latestTimeMap, cityDataMap, uniqueCityList, specifiedTime);
  })
  // もしデータ取得や変換でエラーが起きた場合は、ここで表示します
  .catch((error) => {
    console.error("データを読み込めませんでした:", error);
  });

// スクリプトが最後まで動いたことを示します
console.log("スクリプト終了！(ESM版)");
