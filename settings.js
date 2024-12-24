// -----------------------------------------
// 1) 画面要素を取ってくる
// -----------------------------------------

// 設定を開くボタン
const openSettingsBtn = document.getElementById("open-settings-btn");
// モーダル
const settingsModal = document.getElementById("settings-modal");
// 閉じるボタン
const closeSettingsBtn = document.getElementById("close-settings-btn");
// 保存ボタン
const saveSettingsBtn = document.getElementById("save-settings-btn");

// 積載上限
const maxLoadInput = document.getElementById("maxLoadInput");

// 都市テーブルのtbody
const cityTableBody = document.getElementById("city-setting-table-body");
// 商品テーブルのtbody
const productTableBody = document.getElementById("product-setting-table-body");

// 交渉設定
const initialNegotiationRate = document.getElementById(
  "initialNegotiationRate"
);
const initialSuccessRate = document.getElementById("initialSuccessRate");
const initialFatigue = document.getElementById("initialFatigue");
const fatigueIncrement = document.getElementById("fatigueIncrement");
const negotiationIncrement = document.getElementById("negotiationIncrement");
const maxNegotiations = document.getElementById("maxNegotiations");
const negotiationRateLimit = document.getElementById("negotiationRateLimit");
const failBonusSuccess = document.getElementById("failBonusSuccess");
const firstTimeBonusSuccess = document.getElementById("firstTimeBonusSuccess");

// -----------------------------------------
// 2) モーダルの表示・非表示
// -----------------------------------------

// 「設定を開く」ボタンが押されたらモーダルを表示
openSettingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "flex";
});

// 「閉じる」ボタンが押されたらモーダルを非表示
closeSettingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "none";
});

// -----------------------------------------
// 3) 都市名・商品名のリストを取得 (fetchで)
// -----------------------------------------

// 都市名を入れる配列
let cityList = [];
// 商品名を入れる配列
let productList = [];

// MessagePackの読み込み
// ここでは ./価格/market_data.msgpack を fetch して、
// decode した結果から都市名リストを取得
async function loadCityNamesFromMsgpack() {
  try {
    // msgpackファイルをとってくる
    const response = await fetch("./価格/market_data.msgpack");
    if (!response.ok) {
      console.error("msgpackファイルが読み込めません:", response.status);
      return;
    }
    // バイナリデータを取得
    const arrayBuffer = await response.arrayBuffer();
    // ESM版のデコードを読み込み（script.js で使っていたものと同じならOK）
    // ただし、ここでimportできない場合は、グローバルスコープのdecodeを使うなど要調整
    // 例として、モジュールで @msgpack/msgpack を直接読み込むならこう書く：
    //   import { decode } from "https://unpkg.com/@msgpack/msgpack@3.0.0-beta2/dist.es5+esm/index.mjs";
    // しかし、モジュールスコープで既に読み込み済みの場合はここでは省略します。
    // 使えるものとして仮定:
    const { decode } = await import(
      "https://unpkg.com/@msgpack/msgpack@3.0.0-beta2/dist.es5+esm/index.mjs"
    );
    // decode実行
    const data = decode(new Uint8Array(arrayBuffer));

    // dataは配列で、各要素に "都市名" プロパティがあると仮定
    const citySet = new Set(data.map((item) => item.都市名));
    cityList = Array.from(citySet);
    console.log("取得した都市名:", cityList);
  } catch (error) {
    console.error("MessagePack読み込み中にエラー:", error);
  }
}

// CSV読み込み (life_skill.csv)
async function loadProductNamesFromCSV() {
  try {
    const response = await fetch("./価格/life_skill.csv");
    if (!response.ok) {
      console.error("CSVが読み込めません:", response.status);
      return;
    }
    // テキストで取得
    const csvText = await response.text();
    // 行に分割
    const lines = csvText.split("\n").map((line) => line.trim());
    // 先頭行や空行などを除外して商品名だけ取得 (例: 1列目に商品名が入っていると仮定)
    productList = lines
      .filter((line) => line !== "")
      .map((line) => {
        const cols = line.split(",");
        return cols[0]; // 1列目が商品名
      });
    console.log("取得した商品名:", productList);
  } catch (error) {
    console.error("CSV読み込み中にエラー:", error);
  }
}

// -----------------------------------------
// 4) 動的にテーブル行を作る
// -----------------------------------------

// 都市別設定テーブルを作る
function buildCityTable() {
  // まず中身を空に
  cityTableBody.innerHTML = "";
  // cityList の各都市ごとに行を作る
  cityList.forEach((cityName) => {
    // 行を作る
    const tr = document.createElement("tr");

    // 都市名セル
    const tdCity = document.createElement("td");
    tdCity.textContent = cityName;
    tr.appendChild(tdCity);

    // 税率入力欄
    const tdTax = document.createElement("td");
    const inputTax = document.createElement("input");
    inputTax.type = "number";
    inputTax.id = `cityTax_${cityName}`; // IDに都市名を含める
    tdTax.appendChild(inputTax);
    tr.appendChild(tdTax);

    // 販売個数倍率
    const tdQty = document.createElement("td");
    const inputQty = document.createElement("input");
    inputQty.type = "number";
    inputQty.id = `cityQty_${cityName}`;
    tdQty.appendChild(inputQty);
    tr.appendChild(tdQty);

    // 特産品販売個数倍率
    const tdSpecial = document.createElement("td");
    const inputSpecial = document.createElement("input");
    inputSpecial.type = "number";
    inputSpecial.id = `citySpecialQty_${cityName}`;
    tdSpecial.appendChild(inputSpecial);
    tr.appendChild(tdSpecial);

    // 完成した行をtbodyに追加
    cityTableBody.appendChild(tr);
  });
}

// 商品別設定テーブルを作る
function buildProductTable() {
  // まず中身を空に
  productTableBody.innerHTML = "";
  // productList の各商品ごとに行を作る
  productList.forEach((productName) => {
    const tr = document.createElement("tr");

    // 商品名セル
    const tdPName = document.createElement("td");
    tdPName.textContent = productName;
    tr.appendChild(tdPName);

    // 軽減税率
    const tdReduced = document.createElement("td");
    const inputReduced = document.createElement("input");
    inputReduced.type = "number";
    inputReduced.id = `productReduced_${productName}`;
    tdReduced.appendChild(inputReduced);
    tr.appendChild(tdReduced);

    // 販売個数倍率
    const tdPQty = document.createElement("td");
    const inputPQty = document.createElement("input");
    inputPQty.type = "number";
    inputPQty.id = `productQty_${productName}`;
    tr.appendChild(tdPQty);
    tdPQty.appendChild(inputPQty);

    productTableBody.appendChild(tr);
  });
}

// -----------------------------------------
// 5) ローカルストレージの保存＆初期値セット
// -----------------------------------------

// 保存処理
saveSettingsBtn.addEventListener("click", () => {
  // 都市テーブルの入力値をまとめる
  const citySettings = {};
  cityList.forEach((cityName) => {
    const taxInput = document.getElementById(`cityTax_${cityName}`);
    const qtyInput = document.getElementById(`cityQty_${cityName}`);
    const specialInput = document.getElementById(`citySpecialQty_${cityName}`);
    citySettings[cityName] = {
      tax: taxInput.value,
      qtyRate: qtyInput.value,
      specialQtyRate: specialInput.value,
    };
  });

  // 商品テーブルの入力値をまとめる
  const productSettings = {};
  productList.forEach((productName) => {
    const reducedInput = document.getElementById(
      `productReduced_${productName}`
    );
    const qtyInput = document.getElementById(`productQty_${productName}`);
    productSettings[productName] = {
      reducedTax: reducedInput.value,
      qtyRate: qtyInput.value,
    };
  });

  // 交渉設定
  const negotiationData = {
    initialRate: initialNegotiationRate.value,
    initialSuccess: initialSuccessRate.value,
    initialFatigue: initialFatigue.value,
    fatigueIncrement: fatigueIncrement.value,
    negotiationIncrement: negotiationIncrement.value,
    maxNegotiations: maxNegotiations.value,
    negotiationRateLimit: negotiationRateLimit.value,
    failBonusSuccess: failBonusSuccess.value,
    firstTimeBonusSuccess: firstTimeBonusSuccess.value,
  };

  // 全体をまとめる
  const settingsData = {
    maxLoad: maxLoadInput.value,
    city: citySettings,
    product: productSettings,
    negotiation: negotiationData,
  };

  // JSONにしてローカルストレージに保存
  localStorage.setItem("mySettings", JSON.stringify(settingsData));

  // モーダルを閉じる
  settingsModal.style.display = "none";
  console.log("設定を保存しました:", settingsData);
});

// ローカルストレージから読み込んで画面に反映
function loadSettingsToForm() {
  const savedDataString = localStorage.getItem("mySettings");
  if (!savedDataString) {
    // データが無ければデフォルト値をセットする
    setDefaultValues();
    return;
  }
  const savedData = JSON.parse(savedDataString);

  // 積載上限
  maxLoadInput.value = savedData.maxLoad ?? 830;

  // 都市別
  if (savedData.city) {
    Object.entries(savedData.city).forEach(([cityName, val]) => {
      const taxInput = document.getElementById(`cityTax_${cityName}`);
      const qtyInput = document.getElementById(`cityQty_${cityName}`);
      const specialInput = document.getElementById(
        `citySpecialQty_${cityName}`
      );
      if (!taxInput || !qtyInput || !specialInput) return;
      taxInput.value = val.tax ?? 5;
      qtyInput.value = val.qtyRate ?? 200;
      specialInput.value = val.specialQtyRate ?? 30;
    });
  }

  // 商品別
  if (savedData.product) {
    Object.entries(savedData.product).forEach(([productName, val]) => {
      const reducedInput = document.getElementById(
        `productReduced_${productName}`
      );
      const qtyInput = document.getElementById(`productQty_${productName}`);
      if (!reducedInput || !qtyInput) return;
      reducedInput.value = val.reducedTax ?? 0;
      qtyInput.value = val.qtyRate ?? 0;
    });
  }

  // 交渉設定
  if (savedData.negotiation) {
    initialNegotiationRate.value = savedData.negotiation.initialRate ?? 0;
    initialSuccessRate.value = savedData.negotiation.initialSuccess ?? 70;
    initialFatigue.value = savedData.negotiation.initialFatigue ?? 0;
    fatigueIncrement.value = savedData.negotiation.fatigueIncrement ?? 10;
    negotiationIncrement.value =
      savedData.negotiation.negotiationIncrement ?? 10;
    maxNegotiations.value = savedData.negotiation.maxNegotiations ?? 5;
    negotiationRateLimit.value =
      savedData.negotiation.negotiationRateLimit ?? 20;
    failBonusSuccess.value = savedData.negotiation.failBonusSuccess ?? 5;
    firstTimeBonusSuccess.value =
      savedData.negotiation.firstTimeBonusSuccess ?? 10;
  }
}

// デフォルト値をセットする関数
function setDefaultValues() {
  // 積載上限
  maxLoadInput.value = 830;

  // 都市別
  cityList.forEach((cityName) => {
    const taxInput = document.getElementById(`cityTax_${cityName}`);
    const qtyInput = document.getElementById(`cityQty_${cityName}`);
    const specialInput = document.getElementById(`citySpecialQty_${cityName}`);
    if (!taxInput || !qtyInput || !specialInput) return;
    taxInput.value = 5;
    qtyInput.value = 200;
    specialInput.value = 30;
  });

  // 商品別
  productList.forEach((productName) => {
    const reducedInput = document.getElementById(
      `productReduced_${productName}`
    );
    const qtyInput = document.getElementById(`productQty_${productName}`);
    if (!reducedInput || !qtyInput) return;
    reducedInput.value = 0;
    qtyInput.value = 0;
  });

  // 交渉設定
  initialNegotiationRate.value = 0;
  initialSuccessRate.value = 70;
  initialFatigue.value = 0;
  fatigueIncrement.value = 10;
  negotiationIncrement.value = 10;
  maxNegotiations.value = 5;
  negotiationRateLimit.value = 20;
  failBonusSuccess.value = 5;
  firstTimeBonusSuccess.value = 10;
}

// -----------------------------------------
// 6) ページ読込時の処理
// -----------------------------------------
async function initializePage() {
  // まず都市名を取得
  await loadCityNamesFromMsgpack();
  // 商品名を取得
  await loadProductNamesFromCSV();

  // テーブルを動的生成
  buildCityTable();
  buildProductTable();

  // ローカルストレージから読み込んでフォームに反映
  loadSettingsToForm();
}

// DOMが読み込まれたら開始
window.addEventListener("DOMContentLoaded", () => {
  initializePage();
});
