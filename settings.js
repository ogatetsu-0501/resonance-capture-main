// -----------------------------
// ① ページの要素を取得します
// -----------------------------

// 「設定を開く」ボタン
const openSettingsBtn = document.getElementById("open-settings-btn");
// モーダルの背景(オーバーレイ)
const settingsModal = document.getElementById("settings-modal");
// 「閉じる」ボタン
const closeSettingsBtn = document.getElementById("close-settings-btn");
// 「保存」ボタン
const saveSettingsBtn = document.getElementById("save-settings-btn");

// 入力欄: 積載上限
const maxLoadInput = document.getElementById("maxLoadInput");

// 都市テーブルを表示する場所
const cityTableBody = document.getElementById("city-setting-table-body");
// 商品テーブルを表示する場所
const productTableBody = document.getElementById("product-setting-table-body");

// 交渉設定（値引き、値上げ）
const initialNegotiationRateDiscount = document.getElementById(
  "initialNegotiationRateDiscount"
);
const initialSuccessRateDiscount = document.getElementById(
  "initialSuccessRateDiscount"
);
const initialFatigueDiscount = document.getElementById(
  "initialFatigueDiscount"
);
const fatigueIncrementDiscount = document.getElementById(
  "fatigueIncrementDiscount"
);
const negotiationIncrementDiscount = document.getElementById(
  "negotiationIncrementDiscount"
);
const maxNegotiationsDiscount = document.getElementById(
  "maxNegotiationsDiscount"
);
const negotiationRateLimitDiscount = document.getElementById(
  "negotiationRateLimitDiscount"
);
const failBonusSuccessDiscount = document.getElementById(
  "failBonusSuccessDiscount"
);
const firstTimeBonusSuccessDiscount = document.getElementById(
  "firstTimeBonusSuccessDiscount"
);

const initialNegotiationRateMarkUp = document.getElementById(
  "initialNegotiationRateMarkUp"
);
const initialSuccessRateMarkUp = document.getElementById(
  "initialSuccessRateMarkUp"
);
const initialFatigueMarkUp = document.getElementById("initialFatigueMarkUp");
const fatigueIncrementMarkUp = document.getElementById(
  "fatigueIncrementMarkUp"
);
const negotiationIncrementMarkUp = document.getElementById(
  "negotiationIncrementMarkUp"
);
const maxNegotiationsMarkUp = document.getElementById("maxNegotiationsMarkUp");
const negotiationRateLimitMarkUp = document.getElementById(
  "negotiationRateLimitMarkUp"
);
const failBonusSuccessMarkUp = document.getElementById(
  "failBonusSuccessMarkUp"
);
const firstTimeBonusSuccessMarkUp = document.getElementById(
  "firstTimeBonusSuccessMarkUp"
);

// 都市名の配列（ユニークな都市名）
let cityList = [];
// 商品名の配列
let productList = [];

// -----------------------------
// ② モーダルの開閉処理
// -----------------------------

// 「設定を開く」ボタンが押されたらモーダルを表示
openSettingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "flex"; // flexにすると中央寄せが効く
});

// 「閉じる」ボタンが押されたらモーダルを閉じる
closeSettingsBtn.addEventListener("click", () => {
  settingsModal.style.display = "none";
});

// -----------------------------
// ③ 都市名、商品名リストの取得
// -----------------------------

// (A) ./価格/market_data.msgpack を読み込み、ユニークな都市名を cityList にセット
async function loadCityNamesFromMsgpack() {
  try {
    const response = await fetch("./価格/market_data.msgpack");
    if (!response.ok) {
      console.error("msgpackファイルが読み込めません:", response.status);
      return;
    }
    const arrayBuffer = await response.arrayBuffer();
    // decodeをESMモジュールからインポートする(外部から)
    const { decode } = await import(
      "https://unpkg.com/@msgpack/msgpack@3.0.0-beta2/dist.es5+esm/index.mjs"
    );
    const data = decode(new Uint8Array(arrayBuffer));

    // 「都市名」プロパティを重複なく集める
    const citySet = new Set(data.map((item) => item.都市名));
    cityList = Array.from(citySet);

    console.log("取得した都市名:", cityList);
  } catch (error) {
    console.error("MessagePack読み込みエラー:", error);
  }
}

// (B) ./価格/life_skill.csv を読み込み、商品名リストを productList にセット
async function loadProductNamesFromCSV() {
  try {
    const response = await fetch("./価格/life_skill.csv");
    if (!response.ok) {
      console.error("CSVが読み込めません:", response.status);
      return;
    }
    const csvText = await response.text();
    // 改行で行を分ける
    const lines = csvText.split("\n").map((line) => line.trim());
    // 先頭行や空行は省いて、1列目を商品名とする
    productList = lines
      .filter((line) => line !== "")
      .map((line) => {
        const cols = line.split(",");
        return cols[0]; // 1列目が商品名
      });

    console.log("取得した商品名:", productList);
  } catch (error) {
    console.error("CSV読み込みエラー:", error);
  }
}

// -----------------------------
// ④ 都市別設定テーブル、商品別設定テーブルを動的に生成
// -----------------------------

function buildCityTable() {
  // テーブルを空にする
  cityTableBody.innerHTML = "";

  // cityList の各都市分ループして行を作る
  cityList.forEach((cityName) => {
    const tr = document.createElement("tr");

    // 都市名セル
    const tdCity = document.createElement("td");
    tdCity.textContent = cityName;
    tr.appendChild(tdCity);

    // 税率
    const tdTax = document.createElement("td");
    const inputTax = document.createElement("input");
    inputTax.type = "number";
    inputTax.id = `cityTax_${cityName}`;
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

    cityTableBody.appendChild(tr);
  });
}

function buildProductTable() {
  // テーブルを空にする
  productTableBody.innerHTML = "";

  // productList の各商品分ループして行を作る
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
    tdPQty.appendChild(inputPQty);
    tr.appendChild(tdPQty);

    productTableBody.appendChild(tr);
  });
}

// -----------------------------
// ⑤ 保存と読み込み
// -----------------------------

// 「保存」ボタンが押されたときに実行
saveSettingsBtn.addEventListener("click", () => {
  // 都市テーブルの値をまとめる
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

  // 商品テーブルの値をまとめる
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

  // 交渉設定（値引き、値上げ）
  const discountNegotiation = {
    initialRate: initialNegotiationRateDiscount.value,
    initialSuccess: initialSuccessRateDiscount.value,
    initialFatigue: initialFatigueDiscount.value,
    fatigueIncrement: fatigueIncrementDiscount.value,
    negotiationIncrement: negotiationIncrementDiscount.value,
    maxNegotiations: maxNegotiationsDiscount.value,
    negotiationRateLimit: negotiationRateLimitDiscount.value,
    failBonusSuccess: failBonusSuccessDiscount.value,
    firstTimeBonusSuccess: firstTimeBonusSuccessDiscount.value,
  };
  const markUpNegotiation = {
    initialRate: initialNegotiationRateMarkUp.value,
    initialSuccess: initialSuccessRateMarkUp.value,
    initialFatigue: initialFatigueMarkUp.value,
    fatigueIncrement: fatigueIncrementMarkUp.value,
    negotiationIncrement: negotiationIncrementMarkUp.value,
    maxNegotiations: maxNegotiationsMarkUp.value,
    negotiationRateLimit: negotiationRateLimitMarkUp.value,
    failBonusSuccess: failBonusSuccessMarkUp.value,
    firstTimeBonusSuccess: firstTimeBonusSuccessMarkUp.value,
  };

  // 交渉設定をまとめる
  const negotiationData = {
    discount: discountNegotiation,
    markUp: markUpNegotiation,
  };

  // 全体設定
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

// ローカルストレージから読み込み、フォームに反映する
function loadSettingsToForm() {
  // ローカルストレージのキー"mySettings" から読み込む
  const savedDataString = localStorage.getItem("mySettings");
  if (!savedDataString) {
    // なければデフォルト値をセット
    setDefaultValues();
    return;
  }
  const savedData = JSON.parse(savedDataString);

  // (1) 積載上限
  maxLoadInput.value = savedData.maxLoad ?? 830;

  // (2) 都市別
  if (savedData.city) {
    Object.entries(savedData.city).forEach(([cityName, val]) => {
      const taxInput = document.getElementById(`cityTax_${cityName}`);
      const qtyInput = document.getElementById(`cityQty_${cityName}`);
      const specialInput = document.getElementById(
        `citySpecialQty_${cityName}`
      );
      if (taxInput) taxInput.value = val.tax ?? 5;
      if (qtyInput) qtyInput.value = val.qtyRate ?? 200;
      if (specialInput) specialInput.value = val.specialQtyRate ?? 30;
    });
  }

  // (3) 商品別
  if (savedData.product) {
    Object.entries(savedData.product).forEach(([productName, val]) => {
      const reducedInput = document.getElementById(
        `productReduced_${productName}`
      );
      const qtyInput = document.getElementById(`productQty_${productName}`);
      if (reducedInput) reducedInput.value = val.reducedTax ?? 0;
      if (qtyInput) qtyInput.value = val.qtyRate ?? 0;
    });
  }

  // (4) 交渉設定
  if (savedData.negotiation) {
    // 値引き
    if (savedData.negotiation.discount) {
      initialNegotiationRateDiscount.value =
        savedData.negotiation.discount.initialRate ?? 0;
      initialSuccessRateDiscount.value =
        savedData.negotiation.discount.initialSuccess ?? 70;
      initialFatigueDiscount.value =
        savedData.negotiation.discount.initialFatigue ?? 0;
      fatigueIncrementDiscount.value =
        savedData.negotiation.discount.fatigueIncrement ?? 10;
      negotiationIncrementDiscount.value =
        savedData.negotiation.discount.negotiationIncrement ?? 10;
      maxNegotiationsDiscount.value =
        savedData.negotiation.discount.maxNegotiations ?? 5;
      negotiationRateLimitDiscount.value =
        savedData.negotiation.discount.negotiationRateLimit ?? 20;
      failBonusSuccessDiscount.value =
        savedData.negotiation.discount.failBonusSuccess ?? 5;
      firstTimeBonusSuccessDiscount.value =
        savedData.negotiation.discount.firstTimeBonusSuccess ?? 10;
    }
    // 値上げ
    if (savedData.negotiation.markUp) {
      initialNegotiationRateMarkUp.value =
        savedData.negotiation.markUp.initialRate ?? 0;
      initialSuccessRateMarkUp.value =
        savedData.negotiation.markUp.initialSuccess ?? 70;
      initialFatigueMarkUp.value =
        savedData.negotiation.markUp.initialFatigue ?? 0;
      fatigueIncrementMarkUp.value =
        savedData.negotiation.markUp.fatigueIncrement ?? 10;
      negotiationIncrementMarkUp.value =
        savedData.negotiation.markUp.negotiationIncrement ?? 10;
      maxNegotiationsMarkUp.value =
        savedData.negotiation.markUp.maxNegotiations ?? 5;
      negotiationRateLimitMarkUp.value =
        savedData.negotiation.markUp.negotiationRateLimit ?? 20;
      failBonusSuccessMarkUp.value =
        savedData.negotiation.markUp.failBonusSuccess ?? 5;
      firstTimeBonusSuccessMarkUp.value =
        savedData.negotiation.markUp.firstTimeBonusSuccess ?? 10;
    }
  }
}

// デフォルト値をセットする関数
function setDefaultValues() {
  // (1) 積載上限
  maxLoadInput.value = 830;

  // (2) 都市別 (税率=5, 販売個数倍率=200, 特産品販売個数倍率=30)
  cityList.forEach((cityName) => {
    const taxInput = document.getElementById(`cityTax_${cityName}`);
    const qtyInput = document.getElementById(`cityQty_${cityName}`);
    const specialInput = document.getElementById(`citySpecialQty_${cityName}`);
    if (taxInput) taxInput.value = 5;
    if (qtyInput) qtyInput.value = 200;
    if (specialInput) specialInput.value = 30;
  });

  // (3) 商品別 (軽減税率=0, 販売個数倍率=0)
  productList.forEach((productName) => {
    const reducedInput = document.getElementById(
      `productReduced_${productName}`
    );
    const qtyInput = document.getElementById(`productQty_${productName}`);
    if (reducedInput) reducedInput.value = 0;
    if (qtyInput) qtyInput.value = 0;
  });

  // (4) 交渉設定 (値引き)
  initialNegotiationRateDiscount.value = 0;
  initialSuccessRateDiscount.value = 70;
  initialFatigueDiscount.value = 0;
  fatigueIncrementDiscount.value = 10;
  negotiationIncrementDiscount.value = 10;
  maxNegotiationsDiscount.value = 5;
  negotiationRateLimitDiscount.value = 20;
  failBonusSuccessDiscount.value = 5;
  firstTimeBonusSuccessDiscount.value = 10;

  // (4) 交渉設定 (値上げ)
  initialNegotiationRateMarkUp.value = 0;
  initialSuccessRateMarkUp.value = 70;
  initialFatigueMarkUp.value = 0;
  fatigueIncrementMarkUp.value = 10;
  negotiationIncrementMarkUp.value = 10;
  maxNegotiationsMarkUp.value = 5;
  negotiationRateLimitMarkUp.value = 20;
  failBonusSuccessMarkUp.value = 5;
  firstTimeBonusSuccessMarkUp.value = 10;
}

// -----------------------------
// ⑥ ページ読み込み時の処理
// -----------------------------
async function initializePage() {
  // 1) msgpack から都市名リストを取得
  await loadCityNamesFromMsgpack();
  // 2) CSV から商品名リストを取得
  await loadProductNamesFromCSV();

  // 3) テーブルを動的生成
  buildCityTable();
  buildProductTable();

  // 4) ローカルストレージから読み込んでフォームに反映
  loadSettingsToForm();
}

// DOM読み込み完了で initializePage を呼ぶ
window.addEventListener("DOMContentLoaded", () => {
  initializePage();
});
