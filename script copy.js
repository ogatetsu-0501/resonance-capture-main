document.addEventListener("DOMContentLoaded", function () {
  const folders = [
    "アニタエネルギーラボ",
    "アニタロケット",
    "アニタ武器研究所",
    "クラリティデータセンター",
    "シュグリシティ",
    "フリーポートNo.7",
    "マンド鉱山",
    "鉄路同盟前哨基地",
    "ワンダーランド",
    "荒地駅",
    "雲岫橋基地",
  ];

  const allData = [];
  const storedSettings = JSON.parse(
    localStorage.getItem("userSettings") || "{}"
  );
  const defaultFolderTax = 10;
  const defaultFolderQty = 0;
  const defaultFolderSpec = 0;
  let folderSettings = {};

  // 初期設定のロード
  folders.forEach((f) => {
    folderSettings[f] = {
      tax:
        storedSettings.folderSettings &&
        storedSettings.folderSettings[f] &&
        storedSettings.folderSettings[f].tax != null
          ? storedSettings.folderSettings[f].tax
          : defaultFolderTax,
      qty:
        storedSettings.folderSettings &&
        storedSettings.folderSettings[f] &&
        storedSettings.folderSettings[f].qty != null
          ? storedSettings.folderSettings[f].qty
          : defaultFolderQty,
      spec:
        storedSettings.folderSettings &&
        storedSettings.folderSettings[f] &&
        storedSettings.folderSettings[f].spec != null
          ? storedSettings.folderSettings[f].spec
          : defaultFolderSpec,
    };
  });

  let capacity =
    storedSettings.capacity != null ? storedSettings.capacity : 1000;
  let productSettings = storedSettings.productSettings || {};

  const newestTimes = [];

  // 各フォルダのデータをフェッチ
  const folderPromises = folders.map((folderName) => {
    const csvUrl = `価格/${folderName}/output.csv`;
    return fetch(csvUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`${csvUrl}取得失敗`);
        return res.text();
      })
      .then((data) => {
        const lines = data.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());
        const timeIndex = headers.indexOf("更新時間");
        const sellBuyIndex = headers.indexOf("売りor買い");
        const productIndex = headers.indexOf("商品名");

        if (timeIndex === -1 || sellBuyIndex === -1 || productIndex === -1) {
          console.error("必要な列が不足");
          return;
        }

        let newestTime = null;
        let newestRows = [];

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",").map((c) => c.trim());
          if (row.length === 1 && row[0] === "") continue;

          const t = new Date(row[timeIndex]);
          if (newestTime === null) {
            newestTime = t;
            newestRows = [row];
          } else {
            if (t > newestTime) {
              newestTime = t;
              newestRows = [row];
            } else if (t.getTime() === newestTime.getTime()) {
              newestRows.push(row);
            }
          }
        }

        const sellRows = [],
          buyRows = [];
        newestRows.forEach((r) => {
          if (r[sellBuyIndex] === "売り") sellRows.push(r);
          else buyRows.push(r);
        });

        allData.push({ folderName, headers, sellRows, buyRows });
        if (newestTime) newestTimes.push(newestTime);
      });
  });

  // life_skill.csvをフェッチして商品名リストを取得
  const lifeSkillPromise = fetch("価格/life_skill.csv") // パスを適切に変更してください
    .then((res) => {
      if (!res.ok) throw new Error("life_skill.csv取得失敗");
      return res.text();
    })
    .then((data) => {
      const lifeSkillProducts = data
        .split("\n")
        .map((line) => line.trim().replace(/,$/, "")); // 各行のトリムと末尾のカンマ削除
      return new Set(lifeSkillProducts.filter((name) => name !== "")); // 空行を除外
    })
    .catch((err) => {
      console.error(err);
      return new Set(); // エラー時は空のセットを返す
    });

  // フォルダデータとlife_skillデータを同時に処理
  Promise.all([...folderPromises, lifeSkillPromise]).then((results) => {
    // 最後の結果がlifeSkillProductsSet
    const lifeSkillProductsSet = results[results.length - 1];

    if (allData.length === 0) {
      console.error("データなし");
      return;
    }

    // 最も古い日時の表示
    let oldestTimeDisplay = document.getElementById("oldestTimeDisplay");
    if (newestTimes.length > 0) {
      let oldestTime = newestTimes.reduce((a, b) => (a < b ? a : b));
      oldestTimeDisplay.textContent = `最も古い日時: ${oldestTime.toLocaleString()}`;
    } else {
      oldestTimeDisplay.textContent = "最も古い日時: 取得できませんでした";
    }

    // ConsumptionFatigueLevel.csvのフェッチ
    fetch("価格/ConsumptionFatigueLevel.csv") // パスを適切に変更してください
      .then((res) => {
        if (!res.ok) throw new Error("ConsumptionFatigueLevel.csv取得失敗");
        return res.text();
      })
      .then((fatigueData) => {
        const flines = fatigueData
          .split("\n")
          .map((l) => l.split(",").map((c) => c.trim()));
        const fatigueHeader = flines[0].slice(1);
        const fatigueMap = {};

        for (let i = 1; i < flines.length; i++) {
          const row = flines[i];
          const bFolderName = row[0];
          fatigueMap[bFolderName] = {};

          for (let j = 1; j < row.length; j++) {
            const aFolderName = fatigueHeader[j - 1];
            fatigueMap[bFolderName][aFolderName] = row[j];
          }
        }

        const headers = allData[0].headers;
        const pIndex = headers.indexOf("商品名");
        const priceIndex = headers.indexOf("値段");
        const trendIndex = headers.indexOf("傾向");
        const multiIndex = headers.indexOf("倍率");
        const qtyIndex = headers.indexOf("販売個数");
        const specialIndex = headers.indexOf("特産品");

        // 買いデータに登場する商品のみ対象
        let allProductsSet = new Set();
        allData.forEach((d) => {
          d.buyRows.forEach((r) => {
            allProductsSet.add(r[pIndex]);
          });
        });

        // メインウィンドウでの計算には全ての買いデータの商品を使用
        const allProductsForMain = Array.from(allProductsSet);

        // life_skill.csvに含まれる商品名のみを設定モーダルの「商品別設定」に表示
        const allProductsForSettings = Array.from(allProductsSet).filter(
          (prod) => lifeSkillProductsSet.has(prod)
        );

        // life_skill.csvに含まれる商品が設定モーダルに存在しない場合の警告
        if (allProductsForSettings.length === 0) {
          console.warn(
            "life_skill.csvに含まれる商品が買いデータに存在しません。"
          );
        }

        // 全ての買いデータの商品に対してデフォルト設定を適用（未設定のもの）
        allProductsForMain.forEach((prod) => {
          if (!productSettings[prod]) {
            productSettings[prod] = { taxAdjust: 0, qtyAdjust: 0 };
          }
        });

        // life_skill.csvに含まれる商品で設定が存在しないものにデフォルト設定を適用
        allProductsForSettings.forEach((prod) => {
          if (!productSettings[prod]) {
            productSettings[prod] = { taxAdjust: 0, qtyAdjust: 0 };
          }
        });

        const outputContainer = document.getElementById("outputContainer");

        // 傾向値の変換
        function convertTrend(value) {
          if (value === "-1") return "↘";
          if (value === "1") return "↗";
          return value;
        }

        // テーブルのカラム定義
        const columns = [
          { key: "productName", name: "商品名", numeric: false },
          { key: "profit", name: "利益", numeric: true },
          { key: "displayQtyA", name: "販売個数", numeric: true },
          { key: "priceA", name: "買い値段", numeric: true },
          { key: "priceB_original", name: "売り値段 (元)", numeric: true },
          { key: "priceB_adjusted", name: "売り値段 (調整後)", numeric: true },
          { key: "trendA", name: "買い傾向", numeric: false },
          { key: "multiplierA", name: "買い倍率", numeric: true },
          { key: "trendB", name: "売り傾向", numeric: false },
          { key: "multiplierB", name: "売り倍率", numeric: true },
        ];

        // 税率再計算関数
        function recalcPrice(oldValue, folderName, productName) {
          const folderTax = folderSettings[folderName].tax;
          const productTaxAdj = productSettings[productName].taxAdjust || 0;
          const effectiveTax = folderTax - productTaxAdj;
          const newVal = Math.round(oldValue * (1 + effectiveTax / 100));
          return newVal;
        }

        // 販売個数再計算関数
        function recalcQuantity(origQty, folderName, productName, isSpecial) {
          const folderQ = folderSettings[folderName].qty;
          const productQ = productSettings[productName].qtyAdjust || 0;
          const folderSpec = folderSettings[folderName].spec;
          let total = folderQ + productQ;
          if (isSpecial === "特産品") {
            total += folderSpec;
          }
          const newQty = origQty * (1 + total / 100);
          return newQty;
        }

        // 基本計算関数
        function doBaseCalculation() {
          const resultSets = [];
          for (let i = 0; i < allData.length; i++) {
            for (let j = 0; j < allData.length; j++) {
              if (i === j) continue;
              const dataA = allData[i];
              const dataB = allData[j];

              const buyMapA = {};
              dataA.buyRows.forEach((r) => {
                const productName = r[pIndex];
                const origPriceA = parseFloat(r[priceIndex]);
                const trendA = r[trendIndex];
                const multiplierA = parseFloat(r[multiIndex]);
                const origQtyA = parseFloat(r[qtyIndex]);
                const isSpecial = r[specialIndex];
                buyMapA[productName] = {
                  origPriceA,
                  trendA,
                  multiplierA,
                  origQtyA,
                  isSpecial,
                };
              });

              const sellMapB = {};
              dataB.sellRows.forEach((r) => {
                const productName = r[pIndex];
                const origPriceB = parseFloat(r[priceIndex]);
                const trendB = r[trendIndex];
                const multiplierB = parseFloat(r[multiIndex]);
                sellMapB[productName] = { origPriceB, trendB, multiplierB };
              });

              const itemsForCapCalc = [];
              let fatigueValueCommon = 1;

              for (const productName in buyMapA) {
                if (sellMapB[productName]) {
                  let fv =
                    fatigueMap[dataB.folderName] &&
                    fatigueMap[dataB.folderName][dataA.folderName];
                  if (!fv) fv = "1";
                  const fVal = parseFloat(fv);

                  const priceA = recalcPrice(
                    buyMapA[productName].origPriceA,
                    dataA.folderName,
                    productName
                  );
                  const priceB_original = sellMapB[productName].origPriceB;

                  // 新しい priceB_adjusted の計算
                  const priceA_with_tax =
                    buyMapA[productName].origPriceA *
                    (1 + folderSettings[dataA.folderName].tax / 100);
                  const priceDifference = priceB_original - priceA_with_tax;
                  const adjustedValue =
                    priceDifference < 0
                      ? 0
                      : Math.round(
                          priceDifference *
                            (folderSettings[dataB.folderName].tax / 100)
                        ); // 修正箇所: Bフォルダの税率を使用
                  const priceB_adjusted = priceB_original - adjustedValue;

                  const profit = priceB_adjusted - priceA;
                  const profitForCalc = profit < 0 ? 0 : profit;

                  const adjQtyA = recalcQuantity(
                    buyMapA[productName].origQtyA,
                    dataA.folderName,
                    productName,
                    buyMapA[productName].isSpecial
                  );
                  const displayQtyA = Math.floor(adjQtyA);

                  itemsForCapCalc.push({
                    productName,
                    priceA,
                    priceB_original, // 元の売り値段
                    priceB_adjusted, // 調整後の売り値段
                    trendA: buyMapA[productName].trendA,
                    multiplierA: buyMapA[productName].multiplierA,
                    trendB: sellMapB[productName].trendB,
                    multiplierB: sellMapB[productName].multiplierB,
                    displayQtyA,
                    quantityA: displayQtyA,
                    profit,
                    profitForCalc,
                    fatigue: fVal,
                  });
                  fatigueValueCommon = fVal;
                }
              }

              itemsForCapCalc.sort((a, b) => b.profitForCalc - a.profitForCalc);
              let remain = capacity;
              let totalProfitTimesQuantity = 0;
              const finalRows = [];
              let totalPurchase = 0;
              let totalSell = 0;

              for (const item of itemsForCapCalc) {
                let usedQty = item.quantityA;
                if (remain <= 0) {
                  usedQty = 0;
                } else {
                  if (usedQty > remain) usedQty = remain;
                  remain -= usedQty;
                  totalProfitTimesQuantity +=
                    usedQty * (item.profit < 0 ? 0 : item.profit);
                  totalPurchase += usedQty * item.priceA;
                  totalSell += usedQty * item.priceB_original; // 総売却金額には元の priceB を使用
                }
                finalRows.push({ ...item, quantityA: usedQty });
              }

              if (finalRows.length > 0) {
                const sumRatio = totalProfitTimesQuantity / fatigueValueCommon;
                resultSets.push({
                  aFolderName: dataA.folderName,
                  bFolderName: dataB.folderName,
                  fatigueVal: fatigueValueCommon,
                  sumRatio: sumRatio,
                  rows: finalRows,
                  originalItems: itemsForCapCalc, // 仕入れ書再計算用の元データ
                  totalPurchase: totalPurchase,
                  totalSell: totalSell,
                });
              }
            }
          }
          return resultSets;
        }

        // 仕入れ書再計算関数
        function recalcWithFactor(originalItems, factor, fatigueVal) {
          // factor倍した数量で再度capacity適用
          const recalced = originalItems.map((item) => {
            const newQty = Math.floor(item.displayQtyA * factor);
            return { ...item, quantityA: newQty };
          });
          recalced.sort((a, b) => b.profitForCalc - a.profitForCalc);

          let remain = capacity;
          let totalProfitTimesQuantity = 0;
          let totalPurchase = 0;
          let totalSell = 0;
          for (const item of recalced) {
            let usedQty = item.quantityA;
            if (remain <= 0) {
              usedQty = 0;
            } else {
              if (usedQty > remain) usedQty = remain;
              remain -= usedQty;
              totalProfitTimesQuantity +=
                usedQty * (item.profit < 0 ? 0 : item.profit);
              totalPurchase += usedQty * item.priceA;
              totalSell += usedQty * item.priceB_original; // 総売却金額には元の priceB を使用
            }
          }
          const sumRatio = totalProfitTimesQuantity / fatigueVal;
          return { sumRatio, totalPurchase, totalSell };
        }

        const resultSets = doBaseCalculation();

        // pairsMap作成
        const pairsMap = {};
        resultSets.forEach((set) => {
          const pairKey = [set.aFolderName, set.bFolderName].sort().join("|");
          if (!pairsMap[pairKey]) {
            pairsMap[pairKey] = { AtoB: null, BtoA: null };
          }
          const [baseA, baseB] = [set.aFolderName, set.bFolderName].sort();
          if (set.aFolderName === baseA && set.bFolderName === baseB) {
            pairsMap[pairKey].AtoB = set;
          } else {
            pairsMap[pairKey].BtoA = set;
          }
        });

        // finalPairs作成
        const finalPairs = [];
        for (const key in pairsMap) {
          const pair = pairsMap[key];
          if (pair.AtoB && pair.BtoA) {
            const avgRatio = (pair.AtoB.sumRatio + pair.BtoA.sumRatio) / 2;
            finalPairs.push({
              pairKey: key,
              AtoB: pair.AtoB,
              BtoA: pair.BtoA,
              avgRatio,
            });
          }
        }

        finalPairs.sort((a, b) => b.avgRatio - a.avgRatio);

        // テーブルレンダリング関数
        function renderTable(
          titleElement,
          subtitleElement,
          tableContainer,
          rows
        ) {
          rows.sort((a, b) => parseFloat(b.priceA) - parseFloat(a.priceA));
          let html = "<table><thead><tr>";
          columns.forEach((col, i) => {
            html += `<th data-col-index="${i}">${col.name}</th>`;
          });
          html += "</tr></thead><tbody>";
          rows.forEach((item) => {
            html += "<tr>";
            columns.forEach((col) => {
              let val = item[col.key];
              if (col.key === "trendA" || col.key === "trendB") {
                val = convertTrend(val);
              }
              html += `<td>${val}</td>`;
            });
            html += "</tr>";
          });
          html += "</tbody></table>";
          tableContainer.innerHTML = html;

          const thList = tableContainer.querySelectorAll("th");
          thList.forEach((th) => {
            th.addEventListener("click", () => {
              const colIndex = parseInt(th.getAttribute("data-col-index"), 10);
              const col = columns[colIndex];
              rows.sort((a, b) => {
                let valA = a[col.key],
                  valB = b[col.key];
                if (col.numeric) {
                  valA = parseFloat(valA);
                  valB = parseFloat(valB);
                  return valB - valA;
                } else {
                  if (valA < valB) return 1;
                  if (valA > valB) return -1;
                  return 0;
                }
              });
              renderTable(titleElement, subtitleElement, tableContainer, rows);
            });
          });
        }

        // finalPairsをレンダリング
        finalPairs.forEach((card) => {
          const [folder1, folder2] = card.pairKey.split("|");
          const cardDiv = document.createElement("div");
          cardDiv.className = "pair-card";
          outputContainer.appendChild(cardDiv);

          const cardTitle = document.createElement("h2");
          cardTitle.textContent = `${folder1} ↔ ${folder2}(購入個数×利益/消費疲労値(往復): ${card.avgRatio})`;
          cardDiv.appendChild(cardTitle);

          // A→B表示
          {
            const set = card.AtoB;
            const subtitle = document.createElement("h3");
            subtitle.textContent = `${set.aFolderName} → ${set.bFolderName}(消費疲労値${set.fatigueVal}) 購入個数×利益/消費疲労値(片道): ${set.sumRatio}`;
            cardDiv.appendChild(subtitle);

            // 総購入金額表示
            const totalPurchaseDiv = document.createElement("div");
            totalPurchaseDiv.textContent = `総購入金額: ${Math.round(
              set.totalPurchase
            )}`;
            cardDiv.appendChild(totalPurchaseDiv);

            // 総売却金額表示
            const totalSellDiv = document.createElement("div");
            totalSellDiv.textContent = `総売却金額: ${Math.round(
              set.totalSell
            )}`;
            cardDiv.appendChild(totalSellDiv);

            // 仕入れ書枚数入力欄
            const factorDiv = document.createElement("div");
            factorDiv.innerHTML = `仕入れ書枚数: <input type="number" min="0" value="0" class="factorInput">`;
            cardDiv.appendChild(factorDiv);

            // 仕入れ書使用後の割合表示
            const factorRatio = document.createElement("div");
            factorRatio.textContent = `仕入れ書使用後の購入個数×利益/消費疲労値(片道): (仕入れ書枚数を入力してください)`;
            cardDiv.appendChild(factorRatio);

            // イベントリスナー設定
            const factorInput = factorDiv.querySelector(".factorInput");
            factorInput.addEventListener("input", () => {
              const n = parseInt(factorInput.value, 10) || 0;
              const factor = n + 1;
              const result = recalcWithFactor(
                set.originalItems,
                factor,
                set.fatigueVal
              );
              factorRatio.textContent = `仕入れ書使用後の購入個数×利益/消費疲労値(片道): ${result.sumRatio}`;
              totalPurchaseDiv.textContent = `総購入金額: ${Math.round(
                result.totalPurchase
              )}`;
              totalSellDiv.textContent = `総売却金額: ${Math.round(
                result.totalSell
              )}`;
            });

            // テーブル表示
            const tableContainer = document.createElement("div");
            cardDiv.appendChild(tableContainer);
            renderTable(cardTitle, subtitle, tableContainer, set.rows);
          }

          // B→A表示
          {
            const set = card.BtoA;
            const subtitle = document.createElement("h3");
            subtitle.textContent = `${set.aFolderName} → ${set.bFolderName}(消費疲労値${set.fatigueVal}) 購入個数×利益/消費疲労値(片道): ${set.sumRatio}`;
            cardDiv.appendChild(subtitle);

            // 総購入金額表示
            const totalPurchaseDiv = document.createElement("div");
            totalPurchaseDiv.textContent = `総購入金額: ${Math.round(
              set.totalPurchase
            )}`;
            cardDiv.appendChild(totalPurchaseDiv);

            // 総売却金額表示
            const totalSellDiv = document.createElement("div");
            totalSellDiv.textContent = `総売却金額: ${Math.round(
              set.totalSell
            )}`;
            cardDiv.appendChild(totalSellDiv);

            // 仕入れ書枚数入力欄
            const factorDiv = document.createElement("div");
            factorDiv.innerHTML = `仕入れ書枚数: <input type="number" min="0" value="0" class="factorInput">`;
            cardDiv.appendChild(factorDiv);

            // 仕入れ書使用後の割合表示
            const factorRatio = document.createElement("div");
            factorRatio.textContent = `仕入れ書使用後の購入個数×利益/消費疲労値(片道): (仕入れ書枚数を入力してください)`;
            cardDiv.appendChild(factorRatio);

            // イベントリスナー設定
            const factorInput = factorDiv.querySelector(".factorInput");
            factorInput.addEventListener("input", () => {
              const n = parseInt(factorInput.value, 10) || 0;
              const factor = n + 1;
              const result = recalcWithFactor(
                set.originalItems,
                factor,
                set.fatigueVal
              );
              factorRatio.textContent = `仕入れ書使用後の購入個数×利益/消費疲労値(片道): ${result.sumRatio}`;
              totalPurchaseDiv.textContent = `総購入金額: ${Math.round(
                result.totalPurchase
              )}`;
              totalSellDiv.textContent = `総売却金額: ${Math.round(
                result.totalSell
              )}`;
            });

            // テーブル表示
            const tableContainer = document.createElement("div");
            cardDiv.appendChild(tableContainer);
            renderTable(cardTitle, subtitle, tableContainer, set.rows);
          }
        });

        // 設定モーダルの要素取得
        const settingsButton = document.getElementById("settingsButton");
        const modal = document.getElementById("settingsModal");
        const closeBtn = modal.querySelector(".close");
        const saveBtn = document.getElementById("saveSettings");
        const folderSettingsBody =
          document.getElementById("folderSettingsBody");
        const productSettingsBody = document.getElementById(
          "productSettingsBody"
        );
        const capacityInput = document.getElementById("capacityInput");

        // 設定のレンダリング関数
        function renderSettings() {
          // フォルダ別設定テーブルの生成
          folderSettingsBody.innerHTML = "";
          folders.forEach((f) => {
            const fs = folderSettings[f];
            const tr = document.createElement("tr");

            // フォルダ名
            const tdName = document.createElement("td");
            tdName.textContent = f;
            tr.appendChild(tdName);

            // 税率入力
            const tdTax = document.createElement("td");
            const taxInput = document.createElement("input");
            taxInput.type = "number";
            taxInput.min = "0";
            taxInput.max = "100";
            taxInput.className = "fTax";
            taxInput.setAttribute("data-folder", f);
            taxInput.value = fs.tax;
            tdTax.appendChild(taxInput);
            tr.appendChild(tdTax);

            // 販売個数倍率入力
            const tdQty = document.createElement("td");
            const qtyInput = document.createElement("input");
            qtyInput.type = "number";
            qtyInput.min = "0";
            qtyInput.max = "1000";
            qtyInput.className = "fQty";
            qtyInput.setAttribute("data-folder", f);
            qtyInput.value = fs.qty;
            tdQty.appendChild(qtyInput);
            tr.appendChild(tdQty);

            // 特産品販売個数倍率入力
            const tdSpec = document.createElement("td");
            const specInput = document.createElement("input");
            specInput.type = "number";
            specInput.min = "0";
            specInput.max = "1000";
            specInput.className = "fSpec";
            specInput.setAttribute("data-folder", f);
            specInput.value = fs.spec;
            tdSpec.appendChild(specInput);
            tr.appendChild(tdSpec);

            folderSettingsBody.appendChild(tr);
          });

          // 全体設定
          capacityInput.value = capacity;

          // 商品別設定テーブルの生成（life_skill.csvに含まれる商品名のみ）
          productSettingsBody.innerHTML = "";
          allProductsForSettings.forEach((prod) => {
            const ps = productSettings[prod];
            const tr = document.createElement("tr");

            // 商品名
            const tdName = document.createElement("td");
            tdName.textContent = prod;
            tr.appendChild(tdName);

            // 税率軽減入力
            const tdPTax = document.createElement("td");
            const pTaxInput = document.createElement("input");
            pTaxInput.type = "number";
            pTaxInput.min = "0";
            pTaxInput.className = "pTax";
            pTaxInput.setAttribute("data-product", prod);
            pTaxInput.value = ps.taxAdjust;
            tdPTax.appendChild(pTaxInput);
            tr.appendChild(tdPTax);

            // 個数加算入力
            const tdPQty = document.createElement("td");
            const pQtyInput = document.createElement("input");
            pQtyInput.type = "number";
            pQtyInput.min = "0";
            pQtyInput.className = "pQty";
            pQtyInput.setAttribute("data-product", prod);
            pQtyInput.value = ps.qtyAdjust;
            tdPQty.appendChild(pQtyInput);
            tr.appendChild(tdPQty);

            productSettingsBody.appendChild(tr);
          });
        }

        renderSettings();

        // モーダル表示・非表示の制御
        settingsButton.addEventListener("click", () => {
          modal.style.display = "block";
        });
        closeBtn.addEventListener("click", () => {
          modal.style.display = "none";
        });
        window.addEventListener("click", (e) => {
          if (e.target === modal) modal.style.display = "none";
        });

        // 設定の保存
        saveBtn.addEventListener("click", () => {
          // フォルダ別設定の保存
          const fTaxInputs = document.querySelectorAll(".fTax");
          const fQtyInputs = document.querySelectorAll(".fQty");
          const fSpecInputs = document.querySelectorAll(".fSpec");
          fTaxInputs.forEach((inp) => {
            const f = inp.getAttribute("data-folder");
            folderSettings[f].tax = parseFloat(inp.value) || 10;
          });
          fQtyInputs.forEach((inp) => {
            const f = inp.getAttribute("data-folder");
            folderSettings[f].qty = parseFloat(inp.value) || 0;
          });
          fSpecInputs.forEach((inp) => {
            const f = inp.getAttribute("data-folder");
            folderSettings[f].spec = parseFloat(inp.value) || 0;
          });

          // 全体設定の保存
          capacity = parseFloat(capacityInput.value) || 1000;

          // 商品別設定の保存（life_skill.csvに含まれる商品名のみ）
          const pTaxInputs = document.querySelectorAll(".pTax");
          const pQtyInputs = document.querySelectorAll(".pQty");
          pTaxInputs.forEach((inp) => {
            const p = inp.getAttribute("data-product");
            productSettings[p].taxAdjust = parseFloat(inp.value) || 0;
          });
          pQtyInputs.forEach((inp) => {
            const p = inp.getAttribute("data-product");
            productSettings[p].qtyAdjust = parseFloat(inp.value) || 0;
          });

          // 新しい設定をローカルストレージに保存
          const newSettings = {
            folderSettings: folderSettings,
            capacity: capacity,
            productSettings: productSettings,
          };
          localStorage.setItem("userSettings", JSON.stringify(newSettings));

          // 設定変更後はリロードで再計算
          location.reload();
        });
      })
      .catch((err) => {
        console.error("設定データの読み込み中にエラーが発生しました:", err);
      });
  });
});
