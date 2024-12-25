// ここでは 3.0.0-beta2 の「dist.es5+esm/index.mjs」を直接読み込みます
// これで「decode」や「encode」などがモジュールとして使えます
import {
  decode,
  encode,
} from "https://unpkg.com/@msgpack/msgpack@3.0.0-beta2/dist.es5+esm/index.mjs";

// スクリプト開始の合図
console.log("スクリプト開始！(ESM版)");

// -------------------------------------------
// 1) 既存のコード (MessagePackの取得、表示用関数など)
// -------------------------------------------

// 総売上額を計算する関数
function calculateTotalSales(data) {
  // data中の「値段×販売個数」を合計する
  return data.reduce((total, item) => {
    return total + item.値段 * item.販売個数;
  }, 0);
}

// 平均値段を計算する関数
function calculateAveragePrice(data) {
  // data中の「値段」を全部足して、件数で割る
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
      const itemDate = new Date(item.更新時間.replace(" ", "T"));
      if (itemDate <= specifiedTime && itemDate > latest) {
        return itemDate;
      }
      return latest;
    }, new Date(0));
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
  cityListElement.innerHTML = "";
  cityList.forEach((city) => {
    const li = document.createElement("li");
    li.textContent = city;
    cityListElement.appendChild(li);
  });
}

// HTMLに各都市のデータを表示する関数
function displayCityData(latestTimeMap, cityDataMap, cityList, specifiedTime) {
  const cityDataElement = document.getElementById("city-data");
  cityDataElement.innerHTML = "";

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

    const latestTime = latestTimeMap.get(city);
    if (latestTime.getTime() === new Date(0).getTime()) {
      citySection.innerHTML += "<p>指定した時間以前のデータがありません</p>";
      cityDataElement.appendChild(citySection);
      return;
    }

    const timePara = document.createElement("p");
    timePara.textContent = `都市時間: ${latestTime.toLocaleString()}`;
    citySection.appendChild(timePara);

    const filteredCityData = data.filter((item) => {
      const itemDate = new Date(item.更新時間.replace(" ", "T"));
      return itemDate.getTime() === latestTime.getTime();
    });

    const citySellData = filteredCityData.filter(
      (item) => item["売りor買い"] === "売り"
    );
    const cityBuyData = filteredCityData.filter(
      (item) => item["売りor買い"] === "買い"
    );

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

    cityDataElement.appendChild(citySection);
  });
}

// 更新ボタン (既存)
document.getElementById("update-time").addEventListener("click", () => {
  const timeInput = document.getElementById("specified-time").value;
  const specifiedTime = timeInput ? new Date(timeInput) : new Date();
  displayCityData(
    globalLatestTimeMap,
    globalCityDataMap,
    globalCityList,
    specifiedTime
  );
});

// グローバル変数 (既存)
let globalCityDataMap = new Map();
let globalCityList = [];
let globalLatestTimeMap = new Map();

// -------------------------------------------
// 2) 交渉シミュレーションの正式実装 (再帰的全分岐)
// -------------------------------------------

// 値引き(Discount) の 交渉% / 疲労値 期待値
let discountExpectPct = [];
let discountExpectFatigue = [];

// 値上げ(MarkUp) の 交渉% / 疲労値 期待値
let markUpExpectPct = [];
let markUpExpectFatigue = [];

/**
 * 値引き交渉シミュレーション (再帰実装)
 */
function runDiscountSimulation() {
  // ローカルストレージ (mySettings) 読み込み
  const mySettings = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(mySettings);

  const d =
    settingsData.negotiation && settingsData.negotiation.discount
      ? settingsData.negotiation.discount
      : {};
  const initialNegotiationPercent = parseFloat(d.initialRate) || 0;
  const initialSuccessRate = parseFloat(d.initialSuccess) || 70;
  const initialFatigue = parseFloat(d.initialFatigue) || 0;
  const fatigueIncrement = parseFloat(d.fatigueIncrement) || 10;
  const negotiationPercentStep = parseFloat(d.negotiationIncrement) || 10;
  const maxNegotiations = parseInt(d.maxNegotiations) || 5;
  const maxNegotiationPercent = parseFloat(d.negotiationRateLimit) || 20;
  const failureBonusRate = parseFloat(d.failBonusSuccess) || 5;
  const firstTimeBonusRate = parseFloat(d.firstTimeBonusSuccess) || 10;

  let allBranches = [];

  function simulateDiscountBranches(round, prev, pathStates, pathStr, accProb) {
    if (round > maxNegotiations) {
      allBranches.push({
        path: pathStr,
        probability: accProb,
        states: pathStates,
      });
      return;
    }
    let baseSuccessRate = prev.successRate;
    let adjustedSuccessRate = 0;

    if (round === 1) {
      adjustedSuccessRate = baseSuccessRate + firstTimeBonusRate;
    } else {
      adjustedSuccessRate = prev.isSuccess
        ? baseSuccessRate
        : baseSuccessRate + failureBonusRate;
    }
    adjustedSuccessRate = Math.max(0, adjustedSuccessRate);

    const successProb = Math.min(adjustedSuccessRate / 100, 1.0);
    const failureProb = 1 - successProb;

    // 成功
    {
      const newNegotiationPercent = Math.min(
        prev.negotiationPercent + negotiationPercentStep,
        maxNegotiationPercent
      );
      let newFatigue = prev.fatigue + fatigueIncrement;
      let newSuccessRate = Math.max(0, baseSuccessRate - 10);

      const successState = {
        successRate: newSuccessRate,
        adjustedSuccessRate: adjustedSuccessRate,
        negotiationPercent: newNegotiationPercent,
        fatigue: newFatigue,
        isSuccess: true,
      };
      simulateDiscountBranches(
        round + 1,
        successState,
        [...pathStates, successState],
        pathStr ? pathStr + ",S" : "S",
        accProb * successProb
      );
    }

    // 失敗
    {
      const newNegotiationPercent = prev.negotiationPercent;
      let newFatigue = prev.fatigue + fatigueIncrement;
      let newSuccessRate = baseSuccessRate;

      const failState = {
        successRate: newSuccessRate,
        adjustedSuccessRate: adjustedSuccessRate,
        negotiationPercent: newNegotiationPercent,
        fatigue: newFatigue,
        isSuccess: false,
      };
      simulateDiscountBranches(
        round + 1,
        failState,
        [...pathStates, failState],
        pathStr ? pathStr + ",F" : "F",
        accProb * failureProb
      );
    }
  }

  const initialState = {
    successRate: initialSuccessRate,
    negotiationPercent: initialNegotiationPercent,
    fatigue: initialFatigue,
    isSuccess: false,
  };
  allBranches = [];
  simulateDiscountBranches(1, initialState, [], "", 1.0);

  let pctByRound = [];
  let fatByRound = [];
  for (let round = 1; round <= maxNegotiations; round++) {
    let sumPct = 0,
      sumFat = 0,
      sumProb = 0;
    allBranches.forEach((branch) => {
      const st = branch.states[round - 1];
      if (!st) return;
      const prob = branch.probability;
      sumPct += st.negotiationPercent * prob;
      sumFat += st.fatigue * prob;
      sumProb += prob;
    });
    let avgPct = sumProb > 0 ? sumPct / sumProb : 0;
    let avgFat = sumProb > 0 ? sumFat / sumProb : 0;
    pctByRound[round] = avgPct;
    fatByRound[round] = avgFat;
  }
  pctByRound[0] = initialNegotiationPercent;
  fatByRound[0] = initialFatigue;

  discountExpectPct = pctByRound;
  discountExpectFatigue = fatByRound;

  console.log("=== 値引き(Discount)シミュレーション(正式) ===");
  console.log("discountExpectPct:", discountExpectPct);
  console.log("discountExpectFatigue:", discountExpectFatigue);
}

/**
 * 値上げ交渉シミュレーション (再帰実装)
 */
function runMarkUpSimulation() {
  const mySettings = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(mySettings);

  const m =
    settingsData.negotiation && settingsData.negotiation.markUp
      ? settingsData.negotiation.markUp
      : {};

  const initialNegotiationPercent = parseFloat(m.initialRate) || 0;
  const initialSuccessRate = parseFloat(m.initialSuccess) || 70;
  const initialFatigue = parseFloat(m.initialFatigue) || 0;
  const fatigueIncrement = parseFloat(m.fatigueIncrement) || 10;
  const negotiationPercentStep = parseFloat(m.negotiationIncrement) || 10;
  const maxNegotiations = parseInt(m.maxNegotiations) || 5;
  const maxNegotiationPercent = parseFloat(m.negotiationRateLimit) || 20;
  const failureBonusRate = parseFloat(m.failBonusSuccess) || 5;
  const firstTimeBonusRate = parseFloat(m.firstTimeBonusSuccess) || 10;

  let allBranches = [];

  function simulateMarkUpBranches(round, prev, pathStates, pathStr, accProb) {
    if (round > maxNegotiations) {
      allBranches.push({
        path: pathStr,
        probability: accProb,
        states: pathStates,
      });
      return;
    }
    let baseSuccessRate = prev.successRate;
    let adjustedSuccessRate = 0;
    if (round === 1) {
      adjustedSuccessRate = baseSuccessRate + firstTimeBonusRate;
    } else {
      adjustedSuccessRate = prev.isSuccess
        ? baseSuccessRate
        : baseSuccessRate + failureBonusRate;
    }
    adjustedSuccessRate = Math.max(0, adjustedSuccessRate);

    const successProb = Math.min(adjustedSuccessRate / 100, 1.0);
    const failureProb = 1 - successProb;

    // 成功
    {
      const newNegotiationPercent = Math.min(
        prev.negotiationPercent + negotiationPercentStep,
        maxNegotiationPercent
      );
      let newFatigue = prev.fatigue + fatigueIncrement;
      let newSuccessRate = Math.max(0, baseSuccessRate - 10);

      const successState = {
        successRate: newSuccessRate,
        adjustedSuccessRate: adjustedSuccessRate,
        negotiationPercent: newNegotiationPercent,
        fatigue: newFatigue,
        isSuccess: true,
      };
      simulateMarkUpBranches(
        round + 1,
        successState,
        [...pathStates, successState],
        pathStr ? pathStr + ",S" : "S",
        accProb * successProb
      );
    }

    // 失敗
    {
      const newNegotiationPercent = prev.negotiationPercent;
      let newFatigue = prev.fatigue + fatigueIncrement;
      let newSuccessRate = baseSuccessRate;

      const failState = {
        successRate: newSuccessRate,
        adjustedSuccessRate: adjustedSuccessRate,
        negotiationPercent: newNegotiationPercent,
        fatigue: newFatigue,
        isSuccess: false,
      };
      simulateMarkUpBranches(
        round + 1,
        failState,
        [...pathStates, failState],
        pathStr ? pathStr + ",F" : "F",
        accProb * failureProb
      );
    }
  }

  const initialState = {
    successRate: initialSuccessRate,
    negotiationPercent: initialNegotiationPercent,
    fatigue: initialFatigue,
    isSuccess: false,
  };
  allBranches = [];
  simulateMarkUpBranches(1, initialState, [], "", 1.0);

  let pctByRound = [];
  let fatByRound = [];
  for (let round = 1; round <= maxNegotiations; round++) {
    let sumPct = 0,
      sumFat = 0,
      sumProb = 0;
    allBranches.forEach((branch) => {
      const st = branch.states[round - 1];
      if (!st) return;
      const prob = branch.probability;
      sumPct += st.negotiationPercent * prob;
      sumFat += st.fatigue * prob;
      sumProb += prob;
    });
    let avgPct = sumProb > 0 ? sumPct / sumProb : 0;
    let avgFat = sumProb > 0 ? sumFat / sumProb : 0;
    pctByRound[round] = avgPct;
    fatByRound[round] = avgFat;
  }
  pctByRound[0] = initialNegotiationPercent;
  fatByRound[0] = initialFatigue;

  markUpExpectPct = pctByRound;
  markUpExpectFatigue = fatByRound;

  console.log("=== 値上げ(MarkUp)シミュレーション(正式) ===");
  console.log("markUpExpectPct:", markUpExpectPct);
  console.log("markUpExpectFatigue:", markUpExpectFatigue);
}

// -------------------------------------------
// 3) 販売個数倍率・値引き/値上げ価格付与・最終利益計算など (例)
// -------------------------------------------

// ここでは例として、最新時間の「買い」データに販売個数倍率を計算する関数
function processBuyDataRates(cityBuyData, cityName) {
  // ローカルストレージから設定
  const savedDataString = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(savedDataString);

  let cityRate = 0;
  let citySpecialRate = 0;
  if (settingsData.city && settingsData.city[cityName]) {
    cityRate = Number(settingsData.city[cityName].qtyRate || 0);
    citySpecialRate = Number(settingsData.city[cityName].specialQtyRate || 0);
  }

  cityBuyData.forEach((item) => {
    let productQtyRate = 0;
    if (
      settingsData.product &&
      settingsData.product[item.商品名] &&
      settingsData.product[item.商品名].qtyRate
    ) {
      productQtyRate = Number(settingsData.product[item.商品名].qtyRate);
    }

    let special = 0;
    if (item.特産品 === "特産品") {
      special = citySpecialRate;
    }

    const combinedRate = 1 + (cityRate + productQtyRate + special) / 100;
    const calcCount = Math.round(item.販売個数 * combinedRate);
    const calcCountReceipt = calcCount * 2;

    item.計算後販売個数 = calcCount;
    item.仕入れ書販売個数 = calcCountReceipt;

    console.log(
      `[${cityName}] 商品=${item.商品名} 販売個数→計算後=${calcCount}, 仕入れ書=${calcCountReceipt}`
    );
  });
}

// 値引き買い値段リストを付与 (discountExpectPctを使って計算する例)
function fillDiscountBuyPriceLists(cityBuyData, cityName) {
  const savedDataString = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(savedDataString);

  let cityTaxRate = 0;
  if (
    settingsData.city &&
    settingsData.city[cityName] &&
    settingsData.city[cityName].tax
  ) {
    cityTaxRate = Number(settingsData.city[cityName].tax);
  }

  cityBuyData.forEach((item) => {
    const originalPrice = item.値段;

    // 商品軽減税率
    let productReducedTax = 0;
    if (
      settingsData.product &&
      settingsData.product[item.商品名] &&
      settingsData.product[item.商品名].reducedTax
    ) {
      productReducedTax = Number(settingsData.product[item.商品名].reducedTax);
    }

    let list = [];
    // discountExpectPct[n] で n回目の値引き%期待値を使う (疲労値は discountExpectFatigue[n])
    discountExpectPct.forEach((pct, idx) => {
      const discountedPart = (1 - pct / 100) * originalPrice;
      const finalPrice =
        discountedPart * (1 + (cityTaxRate - productReducedTax) / 100);
      const rounded = Math.round(finalPrice * 100) / 100;
      list.push(rounded);
      console.log(
        `[${cityName}] 商品=${item.商品名} (n=${idx}) => 値引き買い値=${rounded}`
      );
    });
    item.値引き買い値段リスト = list;
  });
}

// 値上げ売り値段リストを付与 (markUpExpectPctを使う例)
function fillMarkUpSellPriceLists(citySellData) {
  citySellData.forEach((item) => {
    const originalPrice = item.値段;
    let list = [];
    markUpExpectPct.forEach((pct, idx) => {
      const newPrice = (1 + pct / 100) * originalPrice;
      const rounded = Math.round(newPrice * 100) / 100;
      list.push(rounded);
      console.log(
        `[${item.都市名}] 商品=${item.商品名} (m=${idx}) => 値上げ売り値=${rounded}`
      );
    });
    item.値上げ売り値段リスト = list;
  });
}

// 最終利益をまとめる (あくまで例: cityA->cityB の順で計算)
let mathGlobalCityDataMap = new Map(); // 都市ごとの最新時間buy/sellをまとめる
let globalCityBuySellList = []; // cityA/cityB階層で最終的に集約

async function loadConsumptionFatigue() {
  // CSVをfetchして、(cityB, cityA) => 疲労値 などを作る例
  // 省略可能
}

// 都市売買リストを作り、(値上げ - 値引き) の最終利益を計算
function processCityBuySellList() {
  const savedDataString = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(savedDataString);

  const pairs = [];
  for (let i = 0; i < globalCityList.length; i++) {
    for (let j = 0; j < globalCityList.length; j++) {
      if (i !== j) {
        pairs.push([globalCityList[i], globalCityList[j]]);
      }
    }
  }

  globalCityBuySellList = [];

  pairs.forEach(([cityA, cityB]) => {
    const cityAData = mathGlobalCityDataMap.get(cityA);
    const cityBData = mathGlobalCityDataMap.get(cityB);
    if (!cityAData || !cityBData) return;

    const buyItems = cityAData.buyData || [];
    const sellItems = cityBData.sellData || [];

    let cityBTaxRate = 0;
    if (
      settingsData.city &&
      settingsData.city[cityB] &&
      settingsData.city[cityB].tax
    ) {
      cityBTaxRate = Number(settingsData.city[cityB].tax);
    }

    // ここで CSV疲労値などもあれば読み込んで pairContainer.疲労値 = ... とか可能

    // cityA & cityB 用のコンテナ
    const pairContainer = {
      cityA: cityA,
      cityB: cityB,
      疲労値: 0, // CSVなどから取得可
      items: [],
    };

    buyItems.forEach((buyItem) => {
      const productName = buyItem.商品名;
      const sellItem = sellItems.find((s) => s.商品名 === productName);
      if (!sellItem) return;

      const discountBuyList = buyItem.値引き買い値段リスト || [];
      const markUpSellList = sellItem.値上げ売り値段リスト || [];

      let productReducedTax = 0;
      if (
        settingsData.product &&
        settingsData.product[productName] &&
        settingsData.product[productName].reducedTax
      ) {
        productReducedTax = Number(
          settingsData.product[productName].reducedTax
        );
      }

      let resultRows = [];
      for (let n = 0; n < discountBuyList.length; n++) {
        for (let m = 0; m < markUpSellList.length; m++) {
          const buyVal = discountBuyList[n];
          const sellVal = markUpSellList[m];
          let profit = sellVal - buyVal;
          // (売り-買い)が正なら 税率を考慮
          if (profit > 0) {
            const factor = 1 - (cityBTaxRate - productReducedTax) / 100;
            profit = profit * factor;
          }
          profit = Math.round(profit * 100) / 100;
          resultRows.push({ n, m, 最終利益: profit });
        }
      }

      pairContainer.items.push({
        商品名: productName,
        // 買い側
        買い傾向: buyItem.傾向 || "不明",
        買い倍率: buyItem.倍率 || "未設定",
        計算後販売個数: buyItem.計算後販売個数 || 0,
        仕入れ書販売個数: buyItem.仕入れ書販売個数 || 0,
        値引き買い値段リスト: discountBuyList,

        // 売り側
        売り傾向: sellItem.傾向 || "不明",
        売り倍率: sellItem.倍率 || "未設定",
        値上げ売り値段リスト: markUpSellList,

        利益計算リスト: resultRows,
      });
    });

    globalCityBuySellList.push(pairContainer);
  });

  console.log("=== 都市売買リスト ===", globalCityBuySellList);
}

// -------------------------------------------
// 4) main処理: fetch -> decode -> 既存表示 -> 交渉シミュレーション -> 値引き/値上げ計算
// -------------------------------------------
fetch("./価格/market_data.msgpack")
  .then((response) => {
    console.log("fetch応答ステータス:", response.status);
    return response.arrayBuffer();
  })
  .then((arrayBuffer) => {
    console.log("バイナリデータのサイズ:", arrayBuffer.byteLength);

    const uint8Array = new Uint8Array(arrayBuffer);
    const data = decode(uint8Array);

    console.log("MessagePackデコード結果:", data);
    console.log("JSON形式で見る:", JSON.stringify(data, null, 2));

    // 既存の集計
    const totalSales = calculateTotalSales(data);
    const averagePrice = calculateAveragePrice(data);
    const sellBuyCounts = countSellBuy(data);

    console.log("総売上額:", totalSales);
    console.log("平均値段:", averagePrice.toFixed(2));
    console.log("売りの数:", sellBuyCounts.sell);
    console.log("買いの数:", sellBuyCounts.buy);

    // 都市リスト
    const uniqueCityList = getUniqueCityList(data);
    console.log("都市名リスト:", uniqueCityList);
    globalCityList = uniqueCityList;

    // 都市別データ
    const cityDataMap = restructureDataByCity(data);
    console.log("都市別データ:", cityDataMap);
    globalCityDataMap = cityDataMap;

    // 最新時間
    const latestTimeMap = getLatestUpdateTimePerCity(cityDataMap);
    console.log("各都市の最新時間:", latestTimeMap);
    globalLatestTimeMap = latestTimeMap;

    // デフォルト指定時間=今
    const specifiedTime = new Date();

    // HTML表示
    displayCityList(uniqueCityList);
    displayCityData(latestTimeMap, cityDataMap, uniqueCityList, specifiedTime);

    // (A) まず再帰的な交渉シミュレーション(正式)を実行
    runDiscountSimulation(); // 値引き
    runMarkUpSimulation(); // 値上げ

    // (B) 都市ごとに最新時間フィルタ→ 販売個数倍率, 値引き/値上げ計算
    globalCityList.forEach((city) => {
      const allCityData = cityDataMap.get(city);
      if (!allCityData) return;

      const cityTime = latestTimeMap.get(city);
      if (!cityTime || cityTime.getTime() === new Date(0).getTime()) {
        console.log(`都市「${city}」はデータが無いか最新時間がありません。`);
        return;
      }

      // 最新時間と同じ更新時間のデータに絞る
      const filteredCityData = allCityData.filter((item) => {
        const d = new Date(item.更新時間.replace(" ", "T"));
        return d.getTime() === cityTime.getTime();
      });

      // (1) 買いデータ
      const cityBuyData = filteredCityData.filter(
        (it) => it["売りor買い"] === "買い"
      );
      // 販売個数倍率を計算
      processBuyDataRates(cityBuyData, city);
      // 値引き買い値段リストを計算( discountExpectPct[n] を用いる )
      fillDiscountBuyPriceLists(cityBuyData, city);

      // (2) 売りデータ
      const citySellData = filteredCityData.filter(
        (it) => it["売りor買い"] === "売り"
      );
      // 値上げ売り値段リストを計算( markUpExpectPct[m] を用いる )
      fillMarkUpSellPriceLists(citySellData);

      // mathGlobalCityDataMap に登録
      mathGlobalCityDataMap.set(city, {
        buyData: cityBuyData,
        sellData: citySellData,
      });
    });

    // (C) 都市売買リストを作り、(売り - 買い) で最終利益を計算 (例)
    processCityBuySellList();
  })
  .catch((error) => {
    console.error("データを読み込めませんでした:", error);
  });

// スクリプト終了
console.log("スクリプト終了！(ESM版)");
