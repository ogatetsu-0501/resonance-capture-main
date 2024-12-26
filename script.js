// ここでは 3.0.0-beta2 の「dist.es5+esm/index.mjs」を直接読み込みます
// これで「decode」や「encode」などがモジュールとして使えます
import {
  decode,
  encode,
} from "https://unpkg.com/@msgpack/msgpack@3.0.0-beta2/dist.es5+esm/index.mjs";

// スクリプト開始の合図
console.log("スクリプト開始！(ESM版)");

// -------------------------------------------
// ① 既存のコード (MessagePackの取得、表示用関数など)
//    （省略せず、すべて残します）
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
  return data.length > 0 ? totalPrice / data.length : 0;
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
// function displayCityData(latestTimeMap, cityDataMap, cityList, specifiedTime) {
//   const cityDataElement = document.getElementById("city-data");
//   cityDataElement.innerHTML = "";

//   cityList.forEach((city) => {
//     const citySection = document.createElement("section");
//     const cityHeader = document.createElement("h4");
//     cityHeader.textContent = city;
//     citySection.appendChild(cityHeader);

//     const data = cityDataMap.get(city);
//     if (!data) {
//       citySection.innerHTML += "<p>データなし</p>";
//       cityDataElement.appendChild(citySection);
//       return;
//     }

//     const latestTime = latestTimeMap.get(city);
//     if (latestTime.getTime() === new Date(0).getTime()) {
//       citySection.innerHTML += "<p>指定した時間以前のデータがありません</p>";
//       cityDataElement.appendChild(citySection);
//       return;
//     }

//     const timePara = document.createElement("p");
//     timePara.textContent = `都市時間: ${latestTime.toLocaleString()}`;
//     citySection.appendChild(timePara);

//     const filteredCityData = data.filter((item) => {
//       const itemDate = new Date(item.更新時間.replace(" ", "T"));
//       return itemDate.getTime() === latestTime.getTime();
//     });

//     const citySellData = filteredCityData.filter(
//       (item) => item["売りor買い"] === "売り"
//     );
//     const cityBuyData = filteredCityData.filter(
//       (item) => item["売りor買い"] === "買い"
//     );

//     const sellHeader = document.createElement("h5");
//     sellHeader.textContent = "売りデータ";
//     citySection.appendChild(sellHeader);
//     if (citySellData.length > 0) {
//       const sellList = document.createElement("ul");
//       citySellData.forEach((item) => {
//         const li = document.createElement("li");
//         li.textContent = `${item.商品名}: 値段=${item.値段}, 販売個数=${item.販売個数}`;
//         sellList.appendChild(li);
//       });
//       citySection.appendChild(sellList);
//     } else {
//       const noSell = document.createElement("p");
//       noSell.textContent = "売りデータなし";
//       citySection.appendChild(noSell);
//     }

//     const buyHeader = document.createElement("h5");
//     buyHeader.textContent = "買いデータ";
//     citySection.appendChild(buyHeader);
//     if (cityBuyData.length > 0) {
//       const buyList = document.createElement("ul");
//       cityBuyData.forEach((item) => {
//         const li = document.createElement("li");
//         li.textContent = `${item.商品名}: 値段=${item.値段}, 販売個数=${item.販売個数}`;
//         buyList.appendChild(li);
//       });
//       citySection.appendChild(buyList);
//     } else {
//       const noBuy = document.createElement("p");
//       noBuy.textContent = "買いデータなし";
//       citySection.appendChild(noBuy);
//     }

//     cityDataElement.appendChild(citySection);
//   });
// }

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
// ② 交渉シミュレーションの正式実装 (再帰的全分岐)
// -------------------------------------------

// 値引き(Discount) の 交渉% / 疲労値 期待値
let discountExpectPct = [];
let discountExpectFatigue = [];

// 値上げ(MarkUp) の 交渉% / 疲労値 期待値
let markUpExpectPct = [];
let markUpExpectFatigue = [];

// グローバルRoundTripProfitsListの定義
let globalRoundTripProfitsList = [];

/**
 * 交渉シミュレーションを実行する共通関数
 * @param {Object} params - シミュレーションパラメータ
 * @returns {Array} - 期待値結果（0からmaxNegotiationsまで）
 */
function simulateNegotiation(params) {
  const {
    initialNegotiationPercent,
    initialSuccessRate,
    initialFatigue,
    fatigueIncrement,
    negotiationPercentStep,
    maxNegotiations,
    maxNegotiationPercent,
    failureBonusRate,
    firstTimeBonusRate,
  } = params;

  let allBranches = [];

  /**
   * 再帰的に全分岐を生成して計算する
   * @param {number} currentRound - 現在の交渉回数 (1〜maxNegotiations)
   * @param {Object} prevState - 前回交渉までの状態
   * @param {Array} pathStates - これまでの交渉状態を配列で保持
   * @param {string} pathStr - "S" or "F" の列挙 (例: "S,S,F")
   * @param {number} accumulatedProbability - ここまでの累積確率
   */
  function simulateBranches(
    currentRound,
    prevState,
    pathStates,
    pathStr,
    accumulatedProbability
  ) {
    // 交渉回数が maxNegotiations を超えたら、分岐を確定させて保存
    if (currentRound > maxNegotiations) {
      allBranches.push({
        path: pathStr,
        probability: accumulatedProbability,
        states: pathStates,
      });
      return;
    }

    // 今回の交渉成功率 (基礎成功率)
    let baseSuccessRate = prevState.successRate;
    // 今回の判定用成功率
    let adjustedSuccessRate = 0;

    if (currentRound === 1) {
      // 初回交渉: 判定用成功率 = 成功率 + 初回成功率加算
      adjustedSuccessRate = baseSuccessRate + firstTimeBonusRate;
    } else {
      // 前回成功なら: 判定用成功率 = 成功率
      // 前回失敗なら: 判定用成功率 = 成功率 + 失敗時加算成功率
      adjustedSuccessRate = prevState.isSuccess
        ? baseSuccessRate
        : baseSuccessRate + failureBonusRate;
    }

    // 成功率は最低0%
    adjustedSuccessRate = Math.max(0, adjustedSuccessRate);

    // 成功確率を計算 (最大1.0)
    const successProb = Math.min(adjustedSuccessRate / 100, 1.0);
    const failureProb = 1 - successProb;

    // ----------------------------
    // 成功分岐
    // ----------------------------
    {
      // 交渉%を negotiationPercentStep だけ上げ、上限にクリップ
      const newNegotiationPercent = Math.min(
        prevState.negotiationPercent + negotiationPercentStep,
        maxNegotiationPercent
      );

      // 疲労値を条件付きで増加
      let newFatigue = prevState.fatigue;
      if (prevState.negotiationPercent < maxNegotiationPercent) {
        newFatigue += fatigueIncrement;
      }

      // 次回成功率を減少
      let newSuccessRate = Math.max(0, baseSuccessRate - 10);

      const successState = {
        successRate: newSuccessRate, // 次回の基礎成功率
        adjustedSuccessRate: adjustedSuccessRate,
        negotiationPercent: newNegotiationPercent,
        fatigue: newFatigue,
        isSuccess: true,
      };

      // 再帰的に次のラウンドをシミュレート
      simulateBranches(
        currentRound + 1,
        successState,
        [...pathStates, successState],
        pathStr ? pathStr + ",S" : "S",
        accumulatedProbability * successProb
      );
    }

    // ----------------------------
    // 失敗分岐
    // ----------------------------
    {
      // 交渉%は変化しない
      const newNegotiationPercent = prevState.negotiationPercent;

      // 疲労値を条件付きで増加
      let newFatigue = prevState.fatigue;
      if (prevState.negotiationPercent < maxNegotiationPercent) {
        newFatigue += fatigueIncrement;
      }

      // 次回成功率は変わらない
      let newSuccessRate = baseSuccessRate;

      const failureState = {
        successRate: newSuccessRate,
        adjustedSuccessRate: adjustedSuccessRate,
        negotiationPercent: newNegotiationPercent,
        fatigue: newFatigue,
        isSuccess: false,
      };

      // 再帰的に次のラウンドをシミュレート
      simulateBranches(
        currentRound + 1,
        failureState,
        [...pathStates, failureState],
        pathStr ? pathStr + ",F" : "F",
        accumulatedProbability * failureProb
      );
    }
  }

  // 初期状態を定義
  const initialState = {
    successRate: initialSuccessRate,
    negotiationPercent: initialNegotiationPercent,
    fatigue: initialFatigue,
    isSuccess: false, // 初回は前回がないので仮にfalseとしておく
  };

  // シミュレーション開始
  simulateBranches(1, initialState, [], "", 1.0);

  // ---- ここから期待値計算 ----
  const expectedResultsByRound = [];

  // n=0のケースを追加（値引きの場合）
  expectedResultsByRound.push({
    round: 0,
    negotiationPercent: 0, // 値引き交渉回数n=0の場合、交渉%は0
    fatigue: 0, // 疲労値も0
  });

  for (let round = 1; round <= maxNegotiations; round++) {
    let sumNegotiationPercent = 0;
    let sumFatigue = 0;
    let sumProbability = 0;

    allBranches.forEach((branch) => {
      // branch.states[round-1] : round回目の交渉終了時点の状態
      const state = branch.states[round - 1];
      if (!state) {
        // その分岐は round 回目まで到達していない(= もう終了している)
        return;
      }
      const prob = branch.probability; // この分岐の到達確率
      sumNegotiationPercent += state.negotiationPercent * prob;
      sumFatigue += state.fatigue * prob;
      sumProbability += prob;
    });

    // 期待値 = 合計 / sumProbability
    let expNegotiationPercent =
      sumProbability > 0 ? sumNegotiationPercent / sumProbability : 0;
    let expFatigue = sumProbability > 0 ? sumFatigue / sumProbability : 0;

    expectedResultsByRound.push({
      round,
      negotiationPercent: expNegotiationPercent,
      fatigue: expFatigue,
    });
  }

  // ---- 結果を返す ----
  return expectedResultsByRound;
}

/**
 * 値引き交渉シミュレーション (再帰実装)
 */
function runDiscountSimulation() {
  // ローカルストレージ (mySettings) 読み込み
  const mySettings = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(mySettings);

  // negotiation.discount の設定を取得
  const d =
    settingsData.negotiation && settingsData.negotiation.discount
      ? settingsData.negotiation.discount
      : {};
  const initialNegotiationPercent = parseFloat(d.initialRate) || 0;
  const initialSuccessRate = parseFloat(d.initialSuccess) || 70;
  const initialFatigue = parseFloat(d.initialFatigue) || 0;
  const fatigueIncrement = parseFloat(d.fatigueIncrement) || 10;
  const negotiationPercentStep = parseFloat(d.negotiationIncrement) || 10;
  const maxNegotiations = parseInt(d.maxNegotiations) || 5; // ここを確認
  const maxNegotiationPercent = parseFloat(d.negotiationRateLimit) || 20;
  const failureBonusRate = parseFloat(d.failBonusSuccess) || 5;
  const firstTimeBonusRate = parseFloat(d.firstTimeBonusSuccess) || 10;

  // デバッグ用ログ
  // console.log("=== Discount Simulation Settings ===");
  // console.log("initialNegotiationPercent:", initialNegotiationPercent);
  // console.log("initialSuccessRate:", initialSuccessRate);
  // console.log("initialFatigue:", initialFatigue);
  // console.log("fatigueIncrement:", fatigueIncrement);
  // console.log("negotiationPercentStep:", negotiationPercentStep);
  // console.log("maxNegotiations:", maxNegotiations);
  // console.log("maxNegotiationPercent:", maxNegotiationPercent);
  // console.log("failureBonusRate:", failureBonusRate);
  // console.log("firstTimeBonusRate:", firstTimeBonusRate);

  // シミュレーションパラメータを設定
  const params = {
    initialNegotiationPercent,
    initialSuccessRate,
    initialFatigue,
    fatigueIncrement,
    negotiationPercentStep,
    maxNegotiations,
    maxNegotiationPercent,
    failureBonusRate,
    firstTimeBonusRate,
  };

  // シミュレーションを実行
  const expectedResults = simulateNegotiation(params);

  // 結果をグローバル変数に保存
  discountExpectPct = expectedResults.map((res) => res.negotiationPercent);
  discountExpectFatigue = expectedResults.map((res) => res.fatigue);

  console.log("=== 値引き(Discount)シミュレーション(正式) ===");
  console.log("discountExpectPct:", discountExpectPct);
  console.log("discountExpectFatigue:", discountExpectFatigue);
}

/**
 * 値上げ交渉シミュレーション (再帰実装)
 */
function runMarkUpSimulation() {
  // ローカルストレージ (mySettings) 読み込み
  const mySettings = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(mySettings);

  // negotiation.markUp の設定を取得
  const m =
    settingsData.negotiation && settingsData.negotiation.markUp
      ? settingsData.negotiation.markUp
      : {};
  const initialNegotiationPercent = parseFloat(m.initialRate) || 0;
  const initialSuccessRate = parseFloat(m.initialSuccess) || 70;
  const initialFatigue = parseFloat(m.initialFatigue) || 0;
  const fatigueIncrement = parseFloat(m.fatigueIncrement) || 10;
  const negotiationPercentStep = parseFloat(m.negotiationIncrement) || 10;
  const maxNegotiations = parseInt(m.maxNegotiations) || 5; // ここを確認
  const maxNegotiationPercent = parseFloat(m.negotiationRateLimit) || 20;
  const failureBonusRate = parseFloat(m.failBonusSuccess) || 5;
  const firstTimeBonusRate = parseFloat(m.firstTimeBonusSuccess) || 10;

  // デバッグ用ログ
  // console.log("=== MarkUp Simulation Settings ===");
  // console.log("initialNegotiationPercent:", initialNegotiationPercent);
  // console.log("initialSuccessRate:", initialSuccessRate);
  // console.log("initialFatigue:", initialFatigue);
  // console.log("fatigueIncrement:", fatigueIncrement);
  // console.log("negotiationPercentStep:", negotiationPercentStep);
  // console.log("maxNegotiations:", maxNegotiations);
  // console.log("maxNegotiationPercent:", maxNegotiationPercent);
  // console.log("failureBonusRate:", failureBonusRate);
  // console.log("firstTimeBonusRate:", firstTimeBonusRate);

  // シミュレーションパラメータを設定
  const params = {
    initialNegotiationPercent,
    initialSuccessRate,
    initialFatigue,
    fatigueIncrement,
    negotiationPercentStep,
    maxNegotiations,
    maxNegotiationPercent,
    failureBonusRate,
    firstTimeBonusRate,
  };

  // シミュレーションを実行
  const expectedResults = simulateNegotiation(params);

  // 結果をグローバル変数に保存
  markUpExpectPct = expectedResults.map((res) => res.negotiationPercent);
  markUpExpectFatigue = expectedResults.map((res) => res.fatigue);

  console.log("=== 値上げ(MarkUp)シミュレーション(正式) ===");
  console.log("markUpExpectPct:", markUpExpectPct);
  console.log("markUpExpectFatigue:", markUpExpectFatigue);
}

// -------------------------------------------
// ③ 販売個数倍率・値引き/値上げ価格付与・最終利益計算など
//     （完全な実装を含む）
// -------------------------------------------

// グローバルマップ: 都市ごとの買いデータと売りデータを保持
let mathGlobalCityDataMap = new Map(); // 都市ごとの最新時間buy/sellをまとめる
let globalCityBuySellList = []; // cityA/cityB階層で最終的に集約

/**
 * 販売個数倍率を計算する関数
 * @param {Array} cityBuyData - 都市の買いデータ
 * @param {string} cityName - 都市名
 */
function processBuyDataRates(cityBuyData, cityName) {
  // ローカルストレージから設定を取得
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

    // console.log(
    //   `[${cityName}] 商品=${item.商品名} 販売個数→計算後=${calcCount}, 仕入れ書=${calcCountReceipt}`
    // );
  });
}

/**
 * 値引き買い値段リストを付与する関数
 * @param {Array} cityBuyData - 都市の買いデータ
 * @param {string} cityName - 都市名
 */
function fillDiscountBuyPriceLists(cityBuyData, cityName) {
  // ローカルストレージから設定を取得
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

    // 商品の減税率
    let productReducedTax = 0;
    if (
      settingsData.product &&
      settingsData.product[item.商品名] &&
      settingsData.product[item.商品名].reducedTax
    ) {
      productReducedTax = Number(settingsData.product[item.商品名].reducedTax);
    }

    let list = [];
    // discountExpectPct[n] で n回目の値引き%期待値を使う
    discountExpectPct.forEach((pct, idx) => {
      const discountedPart = (1 - pct / 100) * originalPrice; // 値引き後の価格
      const finalPrice =
        discountedPart * (1 + (cityTaxRate - productReducedTax) / 100); // 税率を考慮
      const rounded = Math.round(finalPrice * 100) / 100; // 小数点以下2桁に丸める
      list.push(rounded);
      // console.log(
      //   `[${cityName}] 商品=${item.商品名} (n=${idx}) => 値引き買い値=${rounded}`
      // );
    });
    item.値引き買い値段リスト = list; // リストをアイテムに追加
  });
}

/**
 * 値上げ売り値段リストを付与する関数
 * @param {Array} citySellData - 都市の売りデータ
 */
function fillMarkUpSellPriceLists(citySellData) {
  citySellData.forEach((item) => {
    const originalPrice = item.値段;
    let list = [];
    // markUpExpectPct[m] で m回目の値上げ%期待値を使う
    markUpExpectPct.forEach((pct, idx) => {
      const newPrice = (1 + pct / 100) * originalPrice; // 値上げ後の価格
      const rounded = Math.round(newPrice * 100) / 100; // 小数点以下2桁に丸める
      list.push(rounded);
      // console.log(
      //   `[${item.都市名}] 商品=${item.商品名} (m=${idx}) => 値上げ売り値=${rounded}`
      // );
    });
    item.値上げ売り値段リスト = list; // リストをアイテムに追加
  });
}

/**
 * 都市売買リストを作り、(売り - 買い) の最終利益を計算する関数
 */
function processCityBuySellList() {
  // ローカルストレージから設定を取得
  const savedDataString = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(savedDataString);

  // 全ての都市のペア (順列) を作成
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

    // ローカルストレージから都市Bの税率を取得
    let cityBTaxRate = 0;
    if (
      settingsData.city &&
      settingsData.city[cityB] &&
      settingsData.city[cityB].tax
    ) {
      cityBTaxRate = Number(settingsData.city[cityB].tax);
    }

    // --- ここで CSVの疲労値を cityB行, cityA列 から取得 ---
    let fatigueValue = 0;
    if (consumptionFatigueMap.has(cityB)) {
      const rowMap = consumptionFatigueMap.get(cityB); // { cityA: 値, cityA2: 値, ... }
      if (rowMap.get(cityA) != null) {
        fatigueValue = rowMap.get(cityA);
      }
    }

    // ペア用のコンテナを作成
    const pairContainer = {
      cityA: cityA,
      cityB: cityB,
      疲労値: fatigueValue, // CSVから取得した疲労値を追加
      items: [], // ここに商品ごとのデータを追加
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
          // 利益が正の場合、税率を考慮
          if (profit > 0) {
            const factor = 1 - (cityBTaxRate - productReducedTax) / 100;
            profit = profit * factor;
          }
          profit = Math.round(profit * 100) / 100; // 小数点以下2桁に丸める

          resultRows.push({
            n,
            m,
            最終利益: profit,
          });
        }
      }

      // 商品ごとのデータを items に追加
      pairContainer.items.push({
        商品名: productName,

        // 買い側の情報
        買い傾向: buyItem.傾向 || "不明",
        買い倍率: buyItem.倍率 || "未設定",
        計算後販売個数: buyItem.計算後販売個数 || 0,
        仕入れ書販売個数: buyItem.仕入れ書販売個数 || 0,
        値引き買い値段リスト: discountBuyList,

        // 売り側の情報
        売り傾向: sellItem.傾向 || "不明",
        売り倍率: sellItem.倍率 || "未設定",
        値上げ売り値段リスト: markUpSellList,

        // 利益計算結果
        利益計算リスト: resultRows,
      });
    });

    // 作成したペアをグローバルリストに追加
    globalCityBuySellList.push(pairContainer);
  });

  console.log("=== 都市売買リスト ===", globalCityBuySellList);
}

// -------------------------------------------
// ④ CSVの疲労値を読み込む関数
//     loadConsumptionFatigue() を完全実装
// -------------------------------------------

// グローバルマップ: cityB -> { cityA: 疲労値, ... }
let consumptionFatigueMap = new Map();

/**
 * ConsumptionFatigueLevel.csv を fetch し、cityB行 × cityA列 = 疲労値 を consumptionFatigueMap に格納する関数
 */
async function loadConsumptionFatigue() {
  try {
    // CSVファイルをfetch
    const response = await fetch("./価格/ConsumptionFatigueLevel.csv");
    if (!response.ok) {
      console.error(
        "ConsumptionFatigueLevel.csv が取得できませんでした:",
        response.status
      );
      return;
    }
    const csvText = await response.text();

    // CSVを行ごとに分割
    const lines = csvText
      .split("\n")
      .map((line) => line.trim())
      .filter((l) => l);
    if (lines.length < 2) {
      console.error("ConsumptionFatigueLevel.csv の行が足りません。");
      return;
    }

    // 1行目をヘッダーとして取得 (cityA)
    const header = lines[0].split(",");
    // header[0] は空または "CityB", その他が cityA
    const cityAList = header.slice(1); // cityA1, cityA2, ...

    // 各行を処理して Map に格納
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",");
      const cityB = row[0]; // cityB名
      const fatigueValues = row.slice(1); // cityAごとの疲労値

      const cityAMap = new Map();
      cityAList.forEach((cityA, idx) => {
        const valueStr = fatigueValues[idx];
        const fatigueVal = Number(valueStr) || 0; // 数値に変換、NaNなら0
        cityAMap.set(cityA, fatigueVal);
      });

      consumptionFatigueMap.set(cityB, cityAMap);
    }

    console.log("=== consumptionFatigueMap ===", consumptionFatigueMap);
  } catch (error) {
    console.error(
      "ConsumptionFatigueLevel.csv の読み込みでエラーが発生しました:",
      error
    );
  }
}

// -------------------------------------------
// ⑤ main処理: loadConsumptionFatigue() を呼び出してから fetch を実行
// -------------------------------------------

(async () => {
  // (A) まず疲労値のCSVを読み込む
  await loadConsumptionFatigue();

  // (B) MessagePack の市場データを読み込む
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
      // console.log("JSON形式で見る:", JSON.stringify(data, null, 2));

      // --- 既存の集計 ---
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
      // displayCityList(uniqueCityList);
      // displayCityData(
      //   latestTimeMap,
      //   cityDataMap,
      //   uniqueCityList,
      //   specifiedTime
      // );

      // (C) 交渉シミュレーションを実行
      runDiscountSimulation(); // 値引き
      runMarkUpSimulation(); // 値上げ

      // (D) 都市ごとに最新時間フィルタ→ 販売個数倍率, 値引き/値上げ計算
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

      // (E) 都市売買リストを作り、(売り - 買い) で最終利益を計算
      processCityBuySellList();

      // (F) 追加処理: 都市売買リストの利益計算と最適化
      calculateProfits(); // 既存の利益計算関数

      // (G) 往復利益期待値の計算
      calculateRoundTripProfits(); // 新しく追加した関数
    })
    .catch((error) => {
      console.error("データを読み込めませんでした:", error);
    });

  // スクリプト終了の合図
  console.log("スクリプト終了！(ESM版)");
})();

// -------------------------------------------
// ⑥ 追加処理: 都市売買リストの利益計算と最適化
// -------------------------------------------

/**
 * 都市売買リストの利益計算と最適化を行う関数
 */
function calculateProfits() {
  // ローカルストレージから設定を取得
  const savedDataString = localStorage.getItem("mySettings") || "{}";
  const settingsData = JSON.parse(savedDataString);
  const maxLoad = parseFloat(settingsData.maxLoad) || 0;

  // 各都市ペアを処理
  globalCityBuySellList.forEach((pair) => {
    const { cityA, cityB, 疲労値, items } = pair;

    // negotiation.discount と negotiation.markUp の最大交渉回数を取得
    const maxNegotiationsDiscount =
      parseInt(settingsData.negotiation?.discount?.maxNegotiations) || 5;
    const maxNegotiationsMarkUp =
      parseInt(settingsData.negotiation?.markUp?.maxNegotiations) || 5;

    // 最大疲労値毎利益とその組み合わせを初期化
    let maxFatiguePerProfit = -Infinity;
    let optimalN = 0;
    let optimalM = 0;

    // 最大仕入れ書疲労値毎利益とその組み合わせを初期化
    let maxPurchaseFatiguePerProfit = -Infinity;
    let optimalNReceipt = 0;
    let optimalMReceipt = 0;

    // 全てのn,mの組み合わせを試す（値引きと値上げのmaxNegotiationsを個別に使用）
    for (let n = 0; n <= maxNegotiationsDiscount; n++) {
      for (let m = 0; m <= maxNegotiationsMarkUp; m++) {
        // discountFatigue と markUpFatigue の設定
        let discountFatigue = n > 0 ? discountExpectFatigue[n - 1] : 0;
        let markUpFatigue = m > 0 ? markUpExpectFatigue[m - 1] : 0;

        // 総疲労値の計算
        const totalFatigue = 疲労値 + discountFatigue + markUpFatigue;

        if (totalFatigue === 0) {
          // 総疲労値が0の場合はスキップ
          continue;
        }

        // 各 `(n, m)` 組み合わせごとに商品を並び替え
        const sortedItems = [...items].sort((a, b) => {
          // 商品Aの `(n, m)` の最終利益
          const profitA =
            a.利益計算リスト.find((row) => row.n === n && row.m === m)
              ?.最終利益 || 0;
          // 商品Bの `(n, m)` の最終利益
          const profitB =
            b.利益計算リスト.find((row) => row.n === n && row.m === m)
              ?.最終利益 || 0;
          return profitB - profitA; // 大きい順にソート
        });

        // 積載利益と仕入れ書積載利益の初期化
        let loadCount = 0;
        let loadProfit = 0;
        let loadCountReceipt = 0;
        let loadProfitReceipt = 0;

        // 並び替えた順にmaxLoadを使って積載利益を計算
        sortedItems.forEach((item) => {
          // 各商品の `(n, m)` の最終利益を取得
          const profitCalc = item.利益計算リスト.find(
            (row) => row.n === n && row.m === m
          );
          const profit = profitCalc ? profitCalc.最終利益 : 0;

          if (profit < 0) {
            // 最終利益が0未満のものはスキップ
            return;
          }

          // 計算後販売個数を使用して積載
          const addCount = item.計算後販売個数;
          let loadedUnits = 0;
          if (loadCount + addCount > maxLoad) {
            const remainingLoad = maxLoad - loadCount;
            if (remainingLoad > 0) {
              loadCount += remainingLoad;
              loadProfit += remainingLoad * profit;
              loadedUnits = remainingLoad;
            }
          } else {
            loadCount += addCount;
            loadProfit += addCount * profit;
            loadedUnits = addCount;
          }

          if (loadedUnits > 0) {
            console.log(
              `【積載】商品: ${
                item.商品名
              }, 数量: ${loadedUnits}, 利益単価: ${profit}, 合計利益: ${
                loadedUnits * profit
              }`,
              cityA,
              cityB
            );
          }

          // 仕入れ書販売個数を使用して積載
          const addCountReceipt = item.仕入れ書販売個数;
          let loadedUnitsReceipt = 0;
          if (loadCountReceipt + addCountReceipt > maxLoad) {
            const remainingLoadReceipt = maxLoad - loadCountReceipt;
            if (remainingLoadReceipt > 0) {
              loadCountReceipt += remainingLoadReceipt;
              loadProfitReceipt += remainingLoadReceipt * profit;
              loadedUnitsReceipt = remainingLoadReceipt;
            }
          } else {
            loadCountReceipt += addCountReceipt;
            loadProfitReceipt += addCountReceipt * profit;
            loadedUnitsReceipt = addCountReceipt;
          }

          if (loadedUnitsReceipt > 0) {
            // console.log(
            //   `【仕入れ書積載】商品: ${
            //     item.商品名
            //   }, 数量: ${loadedUnitsReceipt}, 利益単価: ${profit}, 合計利益: ${
            //     loadedUnitsReceipt * profit
            //   }`
            // );
          }
        });

        // 積載利益と仕入れ書積載利益が0以下の場合はスキップ
        if (loadProfit <= 0 && loadProfitReceipt <= 0) {
          continue;
        }

        // loadProfit / totalFatigue と loadProfitReceipt / totalFatigue を計算
        const fatiguePerProfit = loadProfit / totalFatigue;
        const purchaseFatiguePerProfit = loadProfitReceipt / totalFatigue;

        // 最大の疲労値毎利益を更新
        if (fatiguePerProfit > maxFatiguePerProfit) {
          maxFatiguePerProfit = fatiguePerProfit;
          optimalN = n;
          optimalM = m;
        }

        // 最大の仕入れ書疲労値毎利益を更新
        if (purchaseFatiguePerProfit > maxPurchaseFatiguePerProfit) {
          maxPurchaseFatiguePerProfit = purchaseFatiguePerProfit;
          optimalNReceipt = n;
          optimalMReceipt = m;
        }

        // コンソールに各組み合わせの結果を表示
        // console.log(`=== 組み合わせ n=${n}, m=${m} ===`);
        // console.log(`総疲労値: ${totalFatigue}`);
        // console.log(`積載利益: ${loadProfit}`);
        // console.log(`積載利益 / 総疲労値: ${fatiguePerProfit}`);
        // console.log(`仕入れ書積載利益: ${loadProfitReceipt}`);
        // console.log(`仕入れ書積載利益 / 総疲労値: ${purchaseFatiguePerProfit}`);
      }
    }

    // 最大の疲労値毎利益と最大仕入れ書疲労値毎利益をペアに設定
    pair.最大疲労値毎利益 = maxFatiguePerProfit;
    pair.値引き回数 = optimalN;
    pair.値上げ回数 = optimalM;

    pair.最大仕入れ書疲労値毎利益 = maxPurchaseFatiguePerProfit;
    pair.仕入れ書値引き回数 = optimalNReceipt;
    pair.仕入れ書値上げ回数 = optimalMReceipt;

    // コンソールにペアの最終結果を表示
    // console.log(`=== 都市ペア ${cityA} -> ${cityB} の計算結果 ===`);
    // console.log(`最大疲労値毎利益: ${pair.最大疲労値毎利益}`);
    // console.log(
    //   `値引き回数: ${pair.値引き回数}, 値上げ回数: ${pair.値上げ回数}`
    // );
    // console.log(`最大仕入れ書疲労値毎利益: ${pair.最大仕入れ書疲労値毎利益}`);
    // console.log(
    //   `仕入れ書値引き回数: ${pair.仕入れ書値引き回数}, 仕入れ書値上げ回数: ${pair.仕入れ書値上げ回数}`
    // );
  });

  // -------------------------------------------
  // 結果の表示（必要に応じて追加）
  // -------------------------------------------

  // ここではコンソールに結果を表示していますが、必要に応じてHTMLに表示することもできます。
  console.log("=== 都市売買リストの最適化結果 ===", globalCityBuySellList);
}

/**
 * 都市間の往復利益期待値を計算し、新しいリストを作成する関数
 */
function calculateRoundTripProfits() {
  const roundTripProfitsList = [];
  const processedPairs = new Set(); // 処理済みの都市ペアを記録するセット

  globalCityBuySellList.forEach((pair) => {
    const { cityA, cityB, 最大仕入れ書疲労値毎利益 } = pair;

    // 順方向のペアキーを作成
    const forwardKey = `${cityA}->${cityB}`;
    // 逆方向のペアキーを作成
    const reverseKey = `${cityB}->${cityA}`;

    // 既に処理済みの場合はスキップ
    if (processedPairs.has(forwardKey) || processedPairs.has(reverseKey)) {
      return;
    }

    // 順方向のペアを探す
    const forwardPair = globalCityBuySellList.find(
      (p) => p.cityA === cityA && p.cityB === cityB
    );
    // 逆方向のペアを探す
    const reversePair = globalCityBuySellList.find(
      (p) => p.cityA === cityB && p.cityB === cityA
    );

    // ペアが存在しない場合はスキップ
    if (!forwardPair || !reversePair) {
      return;
    }

    // 往路（A->B）の交渉回数
    const outboundDiscountCount = forwardPair.値引き回数;
    const outboundMarkUpCount = forwardPair.値上げ回数;

    // 復路（B->A）の交渉回数
    const returnDiscountCount = reversePair.値引き回数;
    const returnMarkUpCount = reversePair.値上げ回数;

    // 仕入れ書往復利益期待値: ペアの最大仕入れ書疲労値毎利益の平均
    const purchaseRoundTripExpectedProfit =
      (forwardPair.最大仕入れ書疲労値毎利益 +
        reversePair.最大仕入れ書疲労値毎利益) /
      2;

    // 仕入れ書獲得利益: 仕入れ書往復利益期待値 - 往復利益期待値
    const purchaseProfit =
      purchaseRoundTripExpectedProfit -
      (forwardPair.最大疲労値毎利益 + reversePair.最大疲労値毎利益) / 2;

    // 仕入れ書往路値引き回数
    const purchaseOutboundDiscountCount = forwardPair.仕入れ書値引き回数;
    // 仕入れ書往路値上げ回数
    const purchaseOutboundMarkUpCount = forwardPair.仕入れ書値上げ回数;
    // 仕入れ書復路値引き回数
    const purchaseReturnDiscountCount = reversePair.仕入れ書値引き回数;
    // 仕入れ書復路値上げ回数
    const purchaseReturnMarkUpCount = reversePair.仕入れ書値上げ回数;

    // 往復利益期待値: ペアの最大疲労値毎利益の平均
    const roundTripExpectedProfit =
      (forwardPair.最大疲労値毎利益 + reversePair.最大疲労値毎利益) / 2;

    // 往復利益期待値リストに追加
    roundTripProfitsList.push({
      cityA: cityA,
      cityB: cityB,
      roundTripProfitExpectedValue: roundTripExpectedProfit,
      purchaseRoundTripExpectedProfit: purchaseRoundTripExpectedProfit,
      purchaseProfit: purchaseProfit,
      outboundDiscountCount: outboundDiscountCount,
      outboundMarkUpCount: outboundMarkUpCount,
      returnDiscountCount: returnDiscountCount,
      returnMarkUpCount: returnMarkUpCount,
      purchaseOutboundDiscountCount: purchaseOutboundDiscountCount,
      purchaseOutboundMarkUpCount: purchaseOutboundMarkUpCount,
      purchaseReturnDiscountCount: purchaseReturnDiscountCount,
      purchaseReturnMarkUpCount: purchaseReturnMarkUpCount,
    });

    // 処理済みとしてマーク
    processedPairs.add(forwardKey);
    processedPairs.add(reverseKey);

    // コンソールに往復利益を表示
    // console.log(
    //   `【往復利益】都市A: ${cityA}, 都市B: ${cityB}, 往復利益期待値: ${roundTripExpectedProfit.toFixed(
    //     2
    //   )}, 仕入れ書往復利益期待値: ${purchaseRoundTripExpectedProfit.toFixed(
    //     2
    //   )}, 仕入れ書獲得利益: ${purchaseProfit.toFixed(2)}`
    // );
  });

  // 新しいリストをグローバル変数に保存（必要に応じて）
  globalRoundTripProfitsList = roundTripProfitsList;

  // 結果をHTMLテーブルに表示
  displayRoundTripProfits(roundTripProfitsList);
}

/**
 * 往復利益期待値をHTMLテーブルに表示する関数
 * @param {Array} roundTripProfitsList - 往復利益期待値リスト
 */
function displayRoundTripProfits(roundTripProfitsList) {
  const resultsTableBody = document.querySelector(
    "#roundTripResultsTable tbody"
  );

  // 既存のテーブル内容をクリア
  resultsTableBody.innerHTML = "";

  roundTripProfitsList.forEach((entry) => {
    const row = document.createElement("tr");

    // 都市A
    const cityACell = document.createElement("td");
    cityACell.textContent = entry.cityA;
    row.appendChild(cityACell);

    // 都市B
    const cityBCell = document.createElement("td");
    cityBCell.textContent = entry.cityB;
    row.appendChild(cityBCell);

    // 往路値引き回数
    const outboundDiscountCell = document.createElement("td");
    outboundDiscountCell.textContent = entry.outboundDiscountCount;
    row.appendChild(outboundDiscountCell);

    // 往路値上げ回数
    const outboundMarkUpCell = document.createElement("td");
    outboundMarkUpCell.textContent = entry.outboundMarkUpCount;
    row.appendChild(outboundMarkUpCell);

    // 復路値引き回数
    const returnDiscountCell = document.createElement("td");
    returnDiscountCell.textContent = entry.returnDiscountCount;
    row.appendChild(returnDiscountCell);

    // 復路値上げ回数
    const returnMarkUpCell = document.createElement("td");
    returnMarkUpCell.textContent = entry.returnMarkUpCount;
    row.appendChild(returnMarkUpCell);

    // 往復利益期待値
    const roundTripProfitCell = document.createElement("td");
    roundTripProfitCell.textContent =
      entry.roundTripProfitExpectedValue.toFixed(2);
    row.appendChild(roundTripProfitCell);

    // 仕入れ書往復利益期待値
    const purchaseRoundTripProfitCell = document.createElement("td");
    purchaseRoundTripProfitCell.textContent =
      entry.purchaseRoundTripExpectedProfit.toFixed(2);
    row.appendChild(purchaseRoundTripProfitCell);

    // 仕入れ書獲得利益
    const purchaseProfitCell = document.createElement("td");
    purchaseProfitCell.textContent = entry.purchaseProfit.toFixed(2);
    row.appendChild(purchaseProfitCell);

    // 仕入れ書往路値引き回数
    const purchaseOutboundDiscountCell = document.createElement("td");
    purchaseOutboundDiscountCell.textContent =
      entry.purchaseOutboundDiscountCount;
    row.appendChild(purchaseOutboundDiscountCell);

    // 仕入れ書往路値上げ回数
    const purchaseOutboundMarkUpCell = document.createElement("td");
    purchaseOutboundMarkUpCell.textContent = entry.purchaseOutboundMarkUpCount;
    row.appendChild(purchaseOutboundMarkUpCell);

    // 仕入れ書復路値引き回数
    const purchaseReturnDiscountCell = document.createElement("td");
    purchaseReturnDiscountCell.textContent = entry.purchaseReturnDiscountCount;
    row.appendChild(purchaseReturnDiscountCell);

    // 仕入れ書復路値上げ回数
    const purchaseReturnMarkUpCell = document.createElement("td");
    purchaseReturnMarkUpCell.textContent = entry.purchaseReturnMarkUpCount;
    row.appendChild(purchaseReturnMarkUpCell);

    resultsTableBody.appendChild(row);
  });

  console.log("=== 往復利益期待値リスト ===", roundTripProfitsList);
}

// -------------------------------------------
// ④ 追加機能はここまで
// -------------------------------------------

/**
 * MessagePackを使用して市場データをデコードし、各種計算を行う関数
 */
async function fetchMarketData() {
  try {
    // MessagePackの市場データを読み込む
    const response = await fetch("./価格/market_data.msgpack");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const data = decode(uint8Array);

    console.log("市場データのデコード結果:", data);

    // 各種計算を実行
    const totalSales = calculateTotalSales(data);
    const averagePrice = calculateAveragePrice(data);
    const sellBuyCounts = countSellBuy(data);

    console.log("総売上額:", totalSales);
    console.log("平均値段:", averagePrice.toFixed(2));
    console.log("売りの数:", sellBuyCounts.sell);
    console.log("買いの数:", sellBuyCounts.buy);

    // 都市リストの取得
    const uniqueCityList = getUniqueCityList(data);
    console.log("ユニークな都市リスト:", uniqueCityList);
    globalCityList = uniqueCityList;

    // 都市別にデータを整形
    const cityDataMap = restructureDataByCity(data);
    console.log("都市別データ:", cityDataMap);
    globalCityDataMap = cityDataMap;

    // 各都市の最新更新時間を取得
    const latestTimeMap = getLatestUpdateTimePerCity(cityDataMap);
    console.log("各都市の最新更新時間:", latestTimeMap);
    globalLatestTimeMap = latestTimeMap;

    // HTMLに都市名リストと都市データを表示
    displayCityList(uniqueCityList);
    displayCityData(latestTimeMap, cityDataMap, uniqueCityList, new Date());

    // 値引きと値上げのシミュレーションを実行
    runDiscountSimulation();
    runMarkUpSimulation();

    // 都市ごとにデータを処理
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

    // 都市売買リストを作り、(売り - 買い) で最終利益を計算
    processCityBuySellList();

    // 都市売買リストの利益計算と最適化
    calculateProfits();

    // 往復利益期待値の計算
    calculateRoundTripProfits();
  } catch (error) {
    // console.error("市場データの取得・処理中にエラーが発生しました:", error);
  }
}

// 市場データの取得と処理を実行
fetchMarketData();

// スクリプト終了の合図
console.log("スクリプト終了！(ESM版)");
