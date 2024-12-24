// ここでは 3.0.0-beta2 の「dist.es5+esm/index.mjs」を直接読み込みます
// これで「decode」や「encode」などがモジュールとして使えます
import {
  decode,
  encode,
} from "https://unpkg.com/@msgpack/msgpack@3.0.0-beta2/dist.es5+esm/index.mjs";

// スクリプトが正しく始まったか確認します
console.log("スクリプト開始！(ESM版)");

// --------------------------------------
// いろいろな計算に使う関数たち
// --------------------------------------

// 総売上額を計算する関数
// 与えられたデータのすべての「値段 × 販売個数」を合計して返します
function calculateTotalSales(data) {
  return data.reduce((total, item) => {
    return total + item.値段 * item.販売個数;
  }, 0);
}

// 平均値段を計算する関数
// 与えられたデータのすべての「値段」を足して、件数で割ります
function calculateAveragePrice(data) {
  const totalPrice = data.reduce((sum, item) => sum + item.値段, 0);
  return totalPrice / data.length;
}

// 売りと買いの商品の数をカウントする関数
// 与えられたデータの「売りor買い」列が「売り」の件数と「買い」の件数を数えます
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
// 与えられたデータの「特産品」列を見て「特産品」と「通常品」に振り分けます
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
// "cityDataMap" は「都市名」をキーにして、その都市のデータ配列を持つ Map
// "specifiedTime" より古いデータのうち、いちばん新しい時刻を探します
function getLatestUpdateTimePerCity(cityDataMap, specifiedTime = new Date()) {
  const latestTimeMap = new Map();

  // cityDataMap のそれぞれの都市をループ
  cityDataMap.forEach((data, city) => {
    // data.reduce で、一番新しい時間を求める
    const latestTime = data.reduce((latest, item) => {
      // 更新時間文字列を "YYYY-MM-DDTHH:mm:ss" 形式にするために空白を "T" に変換
      const itemDate = new Date(item.更新時間.replace(" ", "T"));
      // もし itemDate が指定時間より前で、かつ今までの latest より新しければ更新
      if (itemDate <= specifiedTime && itemDate > latest) {
        return itemDate;
      }
      return latest;
    }, new Date(0)); // 初期値を1970-01-01に設定

    // Mapに保存（キー=都市名、値=その都市の最新時間）
    latestTimeMap.set(city, latestTime);
  });

  return latestTimeMap;
}

// ユニークな都市名リストを作成する関数
// 与えられたデータから「都市名」だけを集め、重複しないようにします
function getUniqueCityList(data) {
  const citySet = new Set(data.map((item) => item.都市名));
  return Array.from(citySet);
}

// 各都市ごとにデータを整形する関数
// 与えられたデータを「都市名」をキーにしてMapに詰めていきます
function restructureDataByCity(data) {
  const cityMap = new Map();
  data.forEach((item) => {
    // まだその都市のキーがMapにないなら、空の配列をセット
    if (!cityMap.has(item.都市名)) {
      cityMap.set(item.都市名, []);
    }
    // その都市の配列に追加
    cityMap.get(item.都市名).push(item);
  });
  return cityMap;
}

// HTMLに都市名リストを表示する関数
// <ul id="city-list"> の中に、都市名を<li>で並べます
function displayCityList(cityList) {
  const cityListElement = document.getElementById("city-list");
  cityListElement.innerHTML = ""; // いったん中身を空に
  cityList.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    cityListElement.appendChild(li);
  });
}

// HTMLに各都市のデータを表示する関数
// <div id="city-data"> の中に、都市ごとのセクションを作って表示します
function displayCityData(latestTimeMap, cityDataMap, cityList, specifiedTime) {
  const cityDataElement = document.getElementById("city-data");
  cityDataElement.innerHTML = ""; // 初期化

  // 全都市をループ
  cityList.forEach((city) => {
    // セクション要素を作る
    const citySection = document.createElement("section");
    // 見出し（h4）に都市名を入れる
    const cityHeader = document.createElement("h4");
    cityHeader.textContent = city;
    citySection.appendChild(cityHeader);

    // cityDataMap からその都市のデータを取得
    const data = cityDataMap.get(city);
    // もしその都市にデータが無ければメッセージを表示
    if (!data) {
      citySection.innerHTML += "<p>データなし</p>";
      cityDataElement.appendChild(citySection);
      return;
    }

    // 各都市の最新更新時間を取得
    const latestTime = latestTimeMap.get(city);
    // latestTime が 1970年だと、指定時間より前のデータが無かったという意味
    if (latestTime.getTime() === new Date(0).getTime()) {
      citySection.innerHTML += "<p>指定した時間以前のデータがありません</p>";
      cityDataElement.appendChild(citySection);
      return;
    }

    // "都市時間" を表示
    const timePara = document.createElement("p");
    timePara.textContent = `都市時間: ${latestTime.toLocaleString()}`;
    citySection.appendChild(timePara);

    // "フィルタ済都市データ"を取得
    // data の中から、更新時間が latestTime と同じものだけを残す
    const filteredCityData = data.filter((item) => {
      const itemDate = new Date(item.更新時間.replace(" ", "T"));
      return itemDate.getTime() === latestTime.getTime();
    });

    // "都市売りデータ" と "都市買いデータ" をそれぞれ取り出す
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

    // 作ったセクションをページに追加
    cityDataElement.appendChild(citySection);
  });
}

// --------------------------------------
// 更新ボタンがクリックされたときの処理
// 指定した時間を読み取って、displayCityDataを更新
// --------------------------------------
document.getElementById("update-time").addEventListener("click", () => {
  // 入力欄から日時を取る
  const timeInput = document.getElementById("specified-time").value;
  // 指定が無ければ現在時刻を使う
  const specifiedTime = timeInput ? new Date(timeInput) : new Date();

  // グローバル変数の最新時間マップ・都市データ・都市リストを使って表示を更新
  displayCityData(
    globalLatestTimeMap,
    globalCityDataMap,
    globalCityList,
    specifiedTime
  );
});

// --------------------------------------
// グローバル変数を用意する
// --------------------------------------
let globalCityDataMap = new Map();
let globalCityList = [];
let globalLatestTimeMap = new Map();

// --------------------------------------
// データを実際に取得して処理する
// --------------------------------------
fetch("./価格/market_data.msgpack")
  // ファイルが取れたらバイナリデータ(arrayBuffer)として受け取る
  .then((response) => {
    console.log("fetch応答ステータス:", response.status);
    return response.arrayBuffer();
  })
  // 受け取ったバイナリデータをデコードして使う
  .then((arrayBuffer) => {
    // バイナリデータのサイズを表示
    console.log("バイナリデータのサイズ:", arrayBuffer.byteLength);

    // Uint8Arrayという形式に変換
    const uint8Array = new Uint8Array(arrayBuffer);

    // importした「decode」関数を呼び出して、MessagePackデータを解凍
    const data = decode(uint8Array);

    // デコードした結果をコンソールに表示
    console.log("MessagePackデコード結果:", data);
    // 見やすいJSON文字列でも表示
    console.log("JSON形式で見る:", JSON.stringify(data, null, 2));

    // ----------------------------
    // 各種計算
    // ----------------------------
    const totalSales = calculateTotalSales(data);
    const averagePrice = calculateAveragePrice(data);
    const sellBuyCounts = countSellBuy(data);

    // コンソールに結果を表示
    console.log("総売上額:", totalSales);
    console.log("平均値段:", averagePrice.toFixed(2));
    console.log("売りの数:", sellBuyCounts.sell);
    console.log("買いの数:", sellBuyCounts.buy);

    // ユニークな都市名をリストアップ
    const uniqueCityList = getUniqueCityList(data);
    console.log("都市名リスト:", uniqueCityList);
    // グローバル変数に保存
    globalCityList = uniqueCityList;

    // 都市ごとにデータをまとめる
    const cityDataMap = restructureDataByCity(data);
    console.log("都市別データ:", cityDataMap);
    // グローバル変数に保存
    globalCityDataMap = cityDataMap;

    // 各都市の最新更新時間を取得
    const latestTimeMap = getLatestUpdateTimePerCity(cityDataMap);
    console.log("各都市の最新更新時間:", latestTimeMap);
    // グローバル変数に保存
    globalLatestTimeMap = latestTimeMap;

    // デフォルトの指定時間は「今」
    const specifiedTime = new Date();

    // 都市名リストをHTMLに表示
    displayCityList(uniqueCityList);

    // 各都市のデータをHTMLに表示
    displayCityData(latestTimeMap, cityDataMap, uniqueCityList, specifiedTime);

    // -----------------------------------------------------------
    // 追加：フィルタ済都市データ、都市売りデータ、都市買いデータを取得
    // -----------------------------------------------------------

    // ユニークな都市リストをループ
    globalCityList.forEach((city) => {
      // まず「都市データ」を取得
      const cityData = globalCityDataMap.get(city);
      // この都市の最新時間(都市時間)を取得
      const cityTime = globalLatestTimeMap.get(city);

      // データや都市時間がないときはスキップ
      if (!cityData || !cityTime) {
        console.log(`都市「${city}」はデータが無いか最新時間がありません。`);
        return;
      }

      // "都市データ"を"都市時間"でフィルタして"フィルタ済都市データ"にする
      const filteredCityData = cityData.filter((item) => {
        const itemDate = new Date(item.更新時間.replace(" ", "T"));
        return itemDate.getTime() === cityTime.getTime();
      });

      // さらに "売り" のみ抽出した "都市売りデータ"
      const citySellData = filteredCityData.filter(
        (item) => item["売りor買い"] === "売り"
      );
      // "買い" のみ抽出した "都市買いデータ"
      const cityBuyData = filteredCityData.filter(
        (item) => item["売りor買い"] === "買い"
      );

      // コンソールに表示して確認
      console.log(`都市: ${city}`);
      console.log("都市時間:", cityTime);
      console.log("フィルタ済都市データ:", filteredCityData);
      console.log("都市売りデータ:", citySellData);
      console.log("都市買いデータ:", cityBuyData);

      // 必要に応じて、ここで追加の計算や表示をしてもOK
    });
  })
  // データ取得や変換のときに何かエラーが起きたらこちらで表示
  .catch((error) => {
    console.error("データを読み込めませんでした:", error);
  });

// スクリプトの最後に「終了！」メッセージを出す
console.log("スクリプト終了！(ESM版)");
