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
  ];

  const allData = [];
  const storedSettings = JSON.parse(
    localStorage.getItem("userSettings") || "{}"
  );
  const defaultFolderTax = 10;
  const defaultFolderQty = 0;
  const defaultFolderSpec = 0;
  let folderSettings = {};
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

  const promises = folders.map((folderName) => {
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

  let allProductsSet = new Set();
  Promise.all(promises).then(() => {
    if (allData.length === 0) {
      console.error("データなし");
      return;
    }

    let oldestTimeDisplay = document.getElementById("oldestTimeDisplay");
    if (newestTimes.length > 0) {
      let oldestTime = newestTimes.reduce((a, b) => (a < b ? a : b));
      oldestTimeDisplay.textContent = `最も古い日時: ${oldestTime.toLocaleString()}`;
    } else {
      oldestTimeDisplay.textContent = "最も古い日時: 取得できませんでした";
    }

    fetch("価格/ConsumptionFatigueLevel.csv")
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
        allData.forEach((d) => {
          d.buyRows.forEach((r) => {
            allProductsSet.add(r[pIndex]);
          });
        });
        const allProducts = Array.from(allProductsSet);
        allProducts.forEach((prod) => {
          if (!productSettings[prod]) {
            productSettings[prod] = { taxAdjust: 0, qtyAdjust: 0 };
          }
        });

        const outputContainer = document.getElementById("outputContainer");

        function convertTrend(value) {
          if (value === "-1") return "↘";
          if (value === "1") return "↗";
          return value;
        }

        const columns = [
          { key: "productName", name: "商品名", numeric: false },
          { key: "profit", name: "利益", numeric: true },
          { key: "displayQtyA", name: "販売個数", numeric: true },
          { key: "priceA", name: "買い値段", numeric: true },
          { key: "priceB", name: "売り値段", numeric: true },
          { key: "trendA", name: "買い傾向", numeric: false },
          { key: "multiplierA", name: "買い倍率", numeric: true },
          { key: "trendB", name: "売り傾向", numeric: false },
          { key: "multiplierB", name: "売り倍率", numeric: true },
        ];

        function recalcPrice(oldValue, folderName, productName) {
          const folderTax = folderSettings[folderName].tax;
          const productTaxAdj = productSettings[productName].taxAdjust || 0;
          const effectiveTax = folderTax - productTaxAdj;
          const newVal = Math.round(oldValue * (1 + effectiveTax / 100));
          return newVal;
        }

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
                  const priceB = recalcPrice(
                    sellMapB[productName].origPriceB,
                    dataB.folderName,
                    productName
                  );

                  const adjQtyA = recalcQuantity(
                    buyMapA[productName].origQtyA,
                    dataA.folderName,
                    productName,
                    buyMapA[productName].isSpecial
                  );
                  const displayQtyA = Math.floor(adjQtyA);

                  const originalProfit = priceB - priceA;
                  const profitForCalc = originalProfit < 0 ? 0 : originalProfit;

                  itemsForCapCalc.push({
                    productName,
                    priceA,
                    trendA: buyMapA[productName].trendA,
                    multiplierA: buyMapA[productName].multiplierA,
                    priceB,
                    trendB: sellMapB[productName].trendB,
                    multiplierB: sellMapB[productName].multiplierB,
                    displayQtyA,
                    quantityA: displayQtyA,
                    profit: originalProfit,
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

              for (const item of itemsForCapCalc) {
                let usedQty = item.quantityA;
                if (remain <= 0) {
                  usedQty = 0;
                } else {
                  if (usedQty > remain) usedQty = remain;
                  remain -= usedQty;
                  totalProfitTimesQuantity +=
                    usedQty * (item.profit < 0 ? 0 : item.profit);
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
                  originalItems: itemsForCapCalc,
                });
              }
            }
          }
          return resultSets;
        }

        function recalcWithFactor(originalItems, factor, fatigueVal) {
          const recalced = originalItems.map((item) => {
            const newQty = Math.floor(item.displayQtyA * factor);
            return { ...item, quantityA: newQty };
          });
          recalced.sort((a, b) => b.profitForCalc - a.profitForCalc);

          let remain = capacity;
          let totalProfitTimesQuantity = 0;
          for (const item of recalced) {
            let usedQty = item.quantityA;
            if (remain <= 0) {
              usedQty = 0;
            } else {
              if (usedQty > remain) usedQty = remain;
              remain -= usedQty;
              totalProfitTimesQuantity +=
                usedQty * (item.profit < 0 ? 0 : item.profit);
            }
          }
          const sumRatio = totalProfitTimesQuantity / fatigueVal;
          return sumRatio;
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

        finalPairs.forEach((card) => {
          const [folder1, folder2] = card.pairKey.split("|");
          const cardDiv = document.createElement("div");
          cardDiv.className = "pair-card";
          outputContainer.appendChild(cardDiv);

          const cardTitle = document.createElement("h2");
          cardTitle.textContent = `${folder1} ↔ ${folder2}(購入個数×利益/消費疲労値(往復): ${card.avgRatio})`;
          cardDiv.appendChild(cardTitle);

          // A→B
          {
            const set = card.AtoB;
            const subtitle = document.createElement("h3");
            subtitle.textContent = `${set.aFolderName} → ${set.bFolderName}(消費疲労値${set.fatigueVal}) 購入個数×利益/消費疲労値(片道): ${set.sumRatio}`;
            cardDiv.appendChild(subtitle);

            // 仕入れ書枚数入力欄
            const factorDiv = document.createElement("div");
            factorDiv.innerHTML = `仕入れ書枚数: <input type="number" min="0" value="0" class="factorInput">`;
            cardDiv.appendChild(factorDiv);

            const factorRatio = document.createElement("div");
            factorRatio.textContent = `仕入れ書使用後の購入個数×利益/消費疲労値(片道): (仕入れ書枚数を入力してください)`;
            cardDiv.appendChild(factorRatio);

            const tableContainer = document.createElement("div");
            cardDiv.appendChild(tableContainer);

            // 元のテーブル(仕入れ書なし)
            renderTable(cardTitle, subtitle, tableContainer, set.rows);

            const factorInput = factorDiv.querySelector(".factorInput");

            factorInput.addEventListener("input", () => {
              const n = parseInt(factorInput.value, 10) || 0;
              const factor = n + 1;
              // 再計算するが、テーブルは変更しない。ratioだけ更新
              const newRatio = recalcWithFactor(
                set.originalItems,
                factor,
                set.fatigueVal
              );
              factorRatio.textContent = `仕入れ書使用後の購入個数×利益/消費疲労値(片道): ${newRatio}`;
            });
          }

          // B→A
          {
            const set = card.BtoA;
            const subtitle = document.createElement("h3");
            subtitle.textContent = `${set.aFolderName} → ${set.bFolderName}(消費疲労値${set.fatigueVal}) 購入個数×利益/消費疲労値(片道): ${set.sumRatio}`;
            cardDiv.appendChild(subtitle);

            const factorDiv = document.createElement("div");
            factorDiv.innerHTML = `仕入れ書枚数: <input type="number" min="0" value="0" class="factorInput">`;
            cardDiv.appendChild(factorDiv);

            const factorRatio = document.createElement("div");
            factorRatio.textContent = `仕入れ書使用後の購入個数×利益/消費疲労値(片道): (仕入れ書枚数を入力してください)`;
            cardDiv.appendChild(factorRatio);

            const tableContainer = document.createElement("div");
            cardDiv.appendChild(tableContainer);

            // 元のテーブル(仕入れ書なし)
            renderTable(cardTitle, subtitle, tableContainer, set.rows);

            const factorInput = factorDiv.querySelector(".factorInput");
            factorInput.addEventListener("input", () => {
              const n = parseInt(factorInput.value, 10) || 0;
              const factor = n + 1;
              const newRatio = recalcWithFactor(
                set.originalItems,
                factor,
                set.fatigueVal
              );
              factorRatio.textContent = `仕入れ書使用後の購入個数×利益/消費疲労値(片道): ${newRatio}`;
            });
          }
        });

        // 設定モーダル
        const settingsButton = document.getElementById("settingsButton");
        const modal = document.getElementById("settingsModal");
        const closeBtn = modal.querySelector(".close");
        const saveBtn = document.getElementById("saveSettings");
        const folderSettingsDiv = document.getElementById("folderSettings");
        const productSettingsDiv = document.getElementById("productSettings");
        const capacityInput = document.getElementById("capacityInput");

        function renderSettings() {
          folderSettingsDiv.innerHTML = "";
          folders.forEach((f) => {
            const fs = folderSettings[f];
            const d = document.createElement("div");
            d.innerHTML = `<strong>${f}</strong><br>
                  税率(%):<input type="number" min="0" max="100" class="fTax" data-folder="${f}" value="${fs.tax}">
                  販売個数倍率(%):<input type="number" min="0" max="1000" class="fQty" data-folder="${f}" value="${fs.qty}">
                  特産品販売個数倍率(%):<input type="number" min="0" max="1000" class="fSpec" data-folder="${f}" value="${fs.spec}">`;
            folderSettingsDiv.appendChild(d);
          });

          capacityInput.value = capacity;

          productSettingsDiv.innerHTML = "";
          allProducts.forEach((prod) => {
            const ps = productSettings[prod];
            const d = document.createElement("div");
            d.innerHTML = `<strong>${prod}</strong> 税率軽減(%):<input type="number" class="pTax" data-product="${prod}" value="${ps.taxAdjust}">
                  個数加算(%):<input type="number" class="pQty" data-product="${prod}" value="${ps.qtyAdjust}">`;
            productSettingsDiv.appendChild(d);
          });
        }

        renderSettings();

        settingsButton.addEventListener("click", () => {
          modal.style.display = "block";
        });
        closeBtn.addEventListener("click", () => {
          modal.style.display = "none";
        });
        window.addEventListener("click", (e) => {
          if (e.target === modal) modal.style.display = "none";
        });

        saveBtn.addEventListener("click", () => {
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
          capacity = parseFloat(capacityInput.value) || 1000;

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

          const newSettings = {
            folderSettings: folderSettings,
            capacity: capacity,
            productSettings: productSettings,
          };
          localStorage.setItem("userSettings", JSON.stringify(newSettings));

          // 設定変更後はリロードで再計算
          location.reload();
        });
      });
  });
});
