// 都市リスト
const cities = [
  "シュグリシティ",
  "マンド鉱山",
  "荒地駅",
  "フリーポートNo.7",
  "鉄路同盟前哨基地",
  "ワンダーランド",
  "クラリティデータセンター",
  "アニタエネルギーラボ",
  "アニタ武器研究所",
  "アニタロケット",
];

// 疲労度データ
const fatigueData = {
  シュグリシティ: {
    シュグリシティ: 24,
    鉄路同盟前哨基地: 24,
    荒地駅: 24,
    マンド鉱山: 24,
    ワンダーランド: 27,
    "フリーポートNo.7": 27,
    クラリティデータセンター: 24,
    アニタエネルギーラボ: 32,
    アニタ武器研究所: 24,
    アニタロケット: 37,
  },
  鉄路同盟前哨基地: {
    シュグリシティ: 24,
    鉄路同盟前哨基地: 24,
    荒地駅: 24,
    マンド鉱山: 24,
    ワンダーランド: 24,
    "フリーポートNo.7": 31,
    クラリティデータセンター: 24,
    アニタエネルギーラボ: 35,
    アニタ武器研究所: 27,
    アニタロケット: 40,
  },
  荒地駅: {
    シュグリシティ: 24,
    鉄路同盟前哨基地: 24,
    荒地駅: 24,
    マンド鉱山: 24,
    ワンダーランド: 25,
    "フリーポートNo.7": 34,
    クラリティデータセンター: 27,
    アニタエネルギーラボ: 39,
    アニタ武器研究所: 31,
    アニタロケット: 44,
  },
  マンド鉱山: {
    シュグリシティ: 24,
    鉄路同盟前哨基地: 24,
    荒地駅: 24,
    マンド鉱山: 24,
    ワンダーランド: 24,
    "フリーポートNo.7": 35,
    クラリティデータセンター: 28,
    アニタエネルギーラボ: 40,
    アニタ武器研究所: 32,
    アニタロケット: 45,
  },
  ワンダーランド: {
    シュグリシティ: 27,
    鉄路同盟前哨基地: 24,
    荒地駅: 25,
    マンド鉱山: 24,
    ワンダーランド: 24,
    "フリーポートNo.7": 40,
    クラリティデータセンター: 33,
    アニタエネルギーラボ: 40,
    アニタ武器研究所: 37,
    アニタロケット: 48,
  },
  "フリーポートNo.7": {
    シュグリシティ: 27,
    鉄路同盟前哨基地: 31,
    荒地駅: 34,
    マンド鉱山: 35,
    ワンダーランド: 40,
    "フリーポートNo.7": 24,
    クラリティデータセンター: 25,
    アニタエネルギーラボ: 24,
    アニタ武器研究所: 24,
    アニタロケット: 28,
  },
  クラリティデータセンター: {
    シュグリシティ: 24,
    鉄路同盟前哨基地: 24,
    荒地駅: 27,
    マンド鉱山: 28,
    ワンダーランド: 33,
    "フリーポートNo.7": 25,
    クラリティデータセンター: 24,
    アニタエネルギーラボ: 29,
    アニタ武器研究所: 24,
    アニタロケット: 34,
  },
  アニタエネルギーラボ: {
    シュグリシティ: 32,
    鉄路同盟前哨基地: 35,
    荒地駅: 39,
    マンド鉱山: 40,
    ワンダーランド: 40,
    "フリーポートNo.7": 24,
    クラリティデータセンター: 29,
    アニタエネルギーラボ: 24,
    アニタ武器研究所: 24,
    アニタロケット: 24,
  },
  アニタ武器研究所: {
    シュグリシティ: 24,
    鉄路同盟前哨基地: 27,
    荒地駅: 31,
    マンド鉱山: 32,
    ワンダーランド: 37,
    "フリーポートNo.7": 24,
    クラリティデータセンター: 24,
    アニタエネルギーラボ: 24,
    アニタ武器研究所: 24,
    アニタロケット: 27,
  },
  アニタロケット: {
    シュグリシティ: 37,
    鉄路同盟前哨基地: 40,
    荒地駅: 44,
    マンド鉱山: 45,
    ワンダーランド: 48,
    "フリーポートNo.7": 28,
    クラリティデータセンター: 34,
    アニタエネルギーラボ: 24,
    アニタ武器研究所: 27,
    アニタロケット: 24,
  },
};

// ページロード時に初期化
window.onload = function () {
  populateCityTaxInputs();
  populateCityBuffInputs();
  loadSavedValues();
  initializeProfitCalculation();
};

// 貨物積載上限を保存
function saveCargoLimit() {
  const cargoLimit = document.getElementById("cargoLimit").value;
  localStorage.setItem("cargoLimit", cargoLimit);
  alert("貨物積載上限を保存しました: " + cargoLimit);
  initializeProfitCalculation();
}

// 都市別税率入力を生成
function populateCityTaxInputs() {
  const container = document.getElementById("cityTaxInputs");
  cities.forEach((city) => {
    const div = document.createElement("div");

    const label = document.createElement("label");
    label.innerText = `${city} 税率:`;
    label.htmlFor = `${city}-tax`;

    const input = document.createElement("input");
    input.type = "number";
    input.id = `${city}-tax`;
    input.placeholder = "例: 5";
    input.onchange = initializeProfitCalculation;

    div.appendChild(label);
    div.appendChild(input);
    container.appendChild(div);
  });
}

// 都市別税率を保存
function saveCityTaxes() {
  cities.forEach((city) => {
    const taxValue = document.getElementById(`${city}-tax`).value;
    localStorage.setItem(`${city}-tax`, taxValue);
  });
  alert("都市別税率を保存しました。");
  initializeProfitCalculation();
}

// 都市別購入個数バフ入力を生成
function populateCityBuffInputs() {
  const container = document.getElementById("cityBuffInputs");
  cities.forEach((city) => {
    const div = document.createElement("div");

    const label = document.createElement("label");
    label.innerText = `${city} 購入個数バフ:`;
    label.htmlFor = `${city}-buff`;

    const input = document.createElement("input");
    input.type = "number";
    input.id = `${city}-buff`;
    input.placeholder = "例: 1.5";
    input.onchange = initializeProfitCalculation;

    div.appendChild(label);
    div.appendChild(input);
    container.appendChild(div);
  });
}

// 都市別購入個数バフを保存
function saveCityBuffs() {
  cities.forEach((city) => {
    const buffValue = document.getElementById(`${city}-buff`).value;
    localStorage.setItem(`${city}-buff`, buffValue);
  });
  alert("都市別購入個数バフを保存しました。");
  initializeProfitCalculation();
}

// 保存した値を読み込む
function loadSavedValues() {
  const cargoLimit = localStorage.getItem("cargoLimit");
  if (cargoLimit) {
    document.getElementById("cargoLimit").value = cargoLimit;
  }

  cities.forEach((city) => {
    const taxValue = localStorage.getItem(`${city}-tax`);
    if (taxValue) {
      document.getElementById(`${city}-tax`).value = taxValue;
    }

    const buffValue = localStorage.getItem(`${city}-buff`);
    if (buffValue) {
      document.getElementById(`${city}-buff`).value = buffValue;
    }
  });
}

// 利益計算の初期化
function initializeProfitCalculation() {
  const csvPath = "output.csv"; // CSVのパス
  fetch(csvPath)
    .then((response) => response.text())
    .then((csvData) => {
      processCsvData(csvData);
    })
    .catch((error) => {
      console.error("CSV読み込みエラー:", error);
    });
}

// CSVデータ処理
async function processCsvData(csvData) {
  const rows = csvData.split("\n").slice(1);
  const buyData = {};
  const sellData = {};

  rows.forEach((row) => {
    const [city, type, item, price, trend, updateTime, quantity, specialty] =
      row.split(",").map((cell) => cell.trim());
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity || "0");

    if (type === "買い") {
      if (!buyData[city]) {
        buyData[city] = [];
      }
      buyData[city].push({
        item,
        price: parsedPrice,
        quantity: parsedQuantity,
        updateTime,
      });
    } else if (type === "売り") {
      if (!sellData[city]) {
        sellData[city] = [];
      }
      sellData[city].push({
        item,
        price: parsedPrice,
        quantity: parsedQuantity,
        updateTime,
      });
    }
  });

  const taxRates = cities.reduce((rates, city) => {
    rates[city] = parseFloat(localStorage.getItem(`${city}-tax`) || "10");
    return rates;
  }, {});

  const buffs = cities.reduce((buffValues, city) => {
    buffValues[city] = parseFloat(localStorage.getItem(`${city}-buff`) || "1");
    return buffValues;
  }, {});

  const cargoLimit = parseInt(localStorage.getItem("cargoLimit") || "0");

  const profitData = calculateProfits(
    buyData,
    sellData,
    taxRates,
    buffs,
    cargoLimit
  );
  displayOneWayProfits(profitData);
  displayTopProfits(profitData);
}

function calculateProfits(buyData, sellData, taxRates, buffs, cargoLimit) {
  const profits = [];
  cities.forEach((cityA) => {
    cities.forEach((cityB) => {
      if (cityA === cityB) return;

      const buys = buyData[cityA] || [];
      const sells = sellData[cityB] || [];

      buys.forEach((buy) => {
        sells.forEach((sell) => {
          if (buy.item === sell.item) {
            const taxAdjustedBuyPrice =
              (buy.price / 1.1) * (1 + taxRates[cityA] / 100);
            const taxAdjustedSellPrice =
              (sell.price / 1.1) * (1 + taxRates[cityB] / 100);
            const adjustedQuantity = Math.min(
              buy.quantity * buffs[cityA],
              cargoLimit
            );
            const profit =
              (taxAdjustedSellPrice - taxAdjustedBuyPrice) * adjustedQuantity;

            if (profit > 0) {
              profits.push({
                cityA,
                cityB,
                item: buy.item,
                buyPrice: taxAdjustedBuyPrice,
                sellPrice: taxAdjustedSellPrice,
                quantity: adjustedQuantity,
                profit,
              });
            }
          }
        });
      });
    });
  });

  return profits.sort((a, b) => b.profit - a.profit);
}

function displayOneWayProfits(profits) {
  console.log("--- 片道利益 ---");
  profits.forEach((profit) => {
    console.log(
      `都市: ${profit.cityA} -> ${profit.cityB}, 商品: ${profit.item}, 利益: ${profit.profit}`
    );
  });
}

function displayTopProfits(profits) {
  const topProfits = profits.slice(0, 5);
  const results = [];

  topProfits.forEach((profit) => {
    if (profit.profit > 0) {
      const roundTripProfit = profit.profit * 2; // 往復利益計算
      console.log(
        `都市: ${profit.cityA} -> ${profit.cityB}, 商品: ${profit.item}, 利益: ${profit.profit}`
      );
      console.log(
        `都市: ${profit.cityB} -> ${profit.cityA}, 商品: ${profit.item}, 利益: ${profit.profit}`
      );

      results.push({
        city: profit.cityA,
        item: profit.item,
        quantity: profit.quantity,
        profit: profit.profit,
      });

      results.push({
        city: profit.cityB,
        item: profit.item,
        quantity: profit.quantity,
        profit: profit.profit,
      });

      console.log(
        `都市: ${profit.cityA} <-> ${profit.cityB}, 往復利益: ${roundTripProfit}`
      );
    }
  });

  results.forEach((result) => {
    console.log(
      `都市: ${result.city}, 購入商品: ${result.item}, 購入個数: ${result.quantity}, 差額: ${result.profit}`
    );
  });
}
