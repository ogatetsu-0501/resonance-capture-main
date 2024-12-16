// ページが全部読み込まれたら処理開始
document.addEventListener("DOMContentLoaded", function () {
  const folders = [
    "アニタエネルギーラボ",
    "アニタロケット",
    "アニタ武器研究所",
    "クラリティデータセンター",
    "シュグリシティ",
    "フリーポートNo.7",
    "マンド鉱山",
  ];

  const allData = [];

  // 価格フォルダ内の各フォルダのCSVを取得
  const promises = folders.map((folderName) => {
    const csvUrl = `価格/${folderName}/output.csv`;
    return fetch(csvUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`ファイルが取得できませんでした: ${csvUrl}`);
        }
        return response.text();
      })
      .then((data) => {
        const lines = data.split("\n");
        const headers = lines[0].split(",").map((h) => h.trim());

        const timeColumnIndex = headers.indexOf("更新時間");
        if (timeColumnIndex === -1) {
          console.error("更新時間列が見つかりません:", folderName);
          return;
        }

        let newestTime = null;
        let newestRows = [];

        // 最新行抽出
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",").map((cell) => cell.trim());
          if (row.length === 1 && row[0] === "") {
            continue;
          }
          const timeStr = row[timeColumnIndex];
          const currentTime = new Date(timeStr);

          if (newestTime === null) {
            newestTime = currentTime;
            newestRows = [row];
          } else {
            if (currentTime > newestTime) {
              newestTime = currentTime;
              newestRows = [row];
            } else if (currentTime.getTime() === newestTime.getTime()) {
              newestRows.push(row);
            }
          }
        }

        const sellBuyColumnIndex = headers.indexOf("売りor買い");
        if (sellBuyColumnIndex === -1) {
          console.error("売りor買い列が見つかりません:", folderName);
          return;
        }

        const sellRows = [];
        const buyRows = [];
        newestRows.forEach((row) => {
          const sellBuyValue = row[sellBuyColumnIndex];
          if (sellBuyValue === "売り") {
            sellRows.push(row);
          } else if (sellBuyValue === "買い") {
            buyRows.push(row);
          }
        });

        allData.push({ folderName, headers, sellRows, buyRows });
      })
      .catch((error) => {
        console.error(`エラー(フォルダ: ${folderName}):`, error);
      });
  });

  Promise.all(promises).then(() => {
    if (allData.length === 0) {
      console.error("データがありません");
      return;
    }

    // ConsumptionFatigueLevel.csv読み込み
    fetch("価格/ConsumptionFatigueLevel.csv")
      .then((response) => {
        if (!response.ok) {
          throw new Error("ConsumptionFatigueLevel.csvを取得できませんでした");
        }
        return response.text();
      })
      .then((fatigueData) => {
        const fLines = fatigueData
          .split("\n")
          .map((line) => line.split(",").map((c) => c.trim()));
        const fatigueHeader = fLines[0].slice(1);
        const fatigueMap = {};
        for (let rowIndex = 1; rowIndex < fLines.length; rowIndex++) {
          const row = fLines[rowIndex];
          const bFolderName = row[0];
          fatigueMap[bFolderName] = {};
          for (let colIndex = 1; colIndex < row.length; colIndex++) {
            const aFolderName = fatigueHeader[colIndex - 1];
            const fatigueValue = row[colIndex];
            fatigueMap[bFolderName][aFolderName] = fatigueValue;
          }
        }

        const headers = allData[0].headers;
        const productColumnIndex = headers.indexOf("商品名");
        const priceColumnIndex = headers.indexOf("値段");
        const trendColumnIndex = headers.indexOf("傾向");
        const multiplierColumnIndex = headers.indexOf("倍率");
        const quantityColumnIndex = headers.indexOf("販売個数");

        if (
          productColumnIndex === -1 ||
          priceColumnIndex === -1 ||
          trendColumnIndex === -1 ||
          multiplierColumnIndex === -1 ||
          quantityColumnIndex === -1
        ) {
          console.error("必要な列が見つかりません");
          return;
        }

        const outputContainer = document.getElementById("outputContainer");

        function convertTrend(value) {
          if (value === "-1") {
            return "↘";
          } else if (value === "1") {
            return "↗";
          } else {
            return value;
          }
        }

        const columns = [
          { key: "productName", name: "商品名", numeric: false },
          { key: "profit", name: "利益", numeric: true },
          { key: "quantityA", name: "販売個数", numeric: true },
          { key: "priceA", name: "買い値段", numeric: true },
          { key: "priceB", name: "売り値段", numeric: true },
          { key: "trendA", name: "買い傾向", numeric: false },
          { key: "multiplierA", name: "買い倍率", numeric: true },
          { key: "trendB", name: "売り傾向", numeric: false },
          { key: "multiplierB", name: "売り倍率", numeric: true },
        ];

        function renderTable(
          titleElement,
          subtitleElement,
          tableContainer,
          rows
        ) {
          // デフォルトでpriceA(買い値段)で降順ソート
          rows.sort((a, b) => parseFloat(b.priceA) - parseFloat(a.priceA));

          let html = "<table>";
          html += "<thead><tr>";
          columns.forEach((col, index) => {
            html += `<th data-col-index="${index}">${col.name}</th>`;
          });
          html += "</tr></thead><tbody>";
          rows.forEach((item) => {
            let rowHtml = "<tr>";
            columns.forEach((col) => {
              let val = item[col.key];
              if (col.key === "trendA" || col.key === "trendB") {
                val = convertTrend(val);
              }
              rowHtml += `<td>${val}</td>`;
            });
            rowHtml += "</tr>";
            html += rowHtml;
          });
          html += "</tbody></table>";

          tableContainer.innerHTML = html;

          const thList = tableContainer.querySelectorAll("th");
          thList.forEach((th) => {
            th.addEventListener("click", () => {
              const colIndex = parseInt(th.getAttribute("data-col-index"), 10);
              const col = columns[colIndex];
              rows.sort((a, b) => {
                let valA = a[col.key];
                let valB = b[col.key];
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

        const resultSets = [];

        // A→B,B→A結果作成
        for (let i = 0; i < allData.length; i++) {
          for (let j = 0; j < allData.length; j++) {
            if (i === j) continue;
            const dataA = allData[i];
            const dataB = allData[j];

            const buyMapA = {};
            dataA.buyRows.forEach((row) => {
              const productName = row[productColumnIndex];
              const priceA = parseFloat(row[priceColumnIndex]);
              const trendA = row[trendColumnIndex];
              const multiplierA = parseFloat(row[multiplierColumnIndex]);
              const quantityA = parseFloat(row[quantityColumnIndex]);
              buyMapA[productName] = { priceA, trendA, multiplierA, quantityA };
            });

            const sellMapB = {};
            dataB.sellRows.forEach((row) => {
              const productName = row[productColumnIndex];
              const priceB = parseFloat(row[priceColumnIndex]);
              const trendB = row[trendColumnIndex];
              const multiplierB = parseFloat(row[multiplierColumnIndex]);
              sellMapB[productName] = { priceB, trendB, multiplierB };
            });

            const comparisonRows = [];
            let fatigueValueCommon = 1;
            let totalProfitTimesQuantity = 0;

            for (const productName in buyMapA) {
              if (sellMapB.hasOwnProperty(productName)) {
                let fatigueValue =
                  fatigueMap[dataB.folderName] &&
                  fatigueMap[dataB.folderName][dataA.folderName];
                if (!fatigueValue) {
                  fatigueValue = "1";
                }
                const fVal = parseFloat(fatigueValue);

                const priceA = buyMapA[productName].priceA;
                const priceB = sellMapB[productName].priceB;
                const originalProfit = priceB - priceA;
                const profitForCalc = originalProfit < 0 ? 0 : originalProfit;

                const quantityA = buyMapA[productName].quantityA;
                const profitTimesQuantity = quantityA * profitForCalc;
                totalProfitTimesQuantity += profitTimesQuantity;

                comparisonRows.push({
                  productName: productName,
                  priceA: priceA,
                  trendA: buyMapA[productName].trendA,
                  multiplierA: buyMapA[productName].multiplierA,
                  quantityA: quantityA,
                  priceB: priceB,
                  trendB: sellMapB[productName].trendB,
                  multiplierB: sellMapB[productName].multiplierB,
                  fatigue: fatigueValue,
                  profit: originalProfit,
                });

                fatigueValueCommon = fVal;
              }
            }

            if (comparisonRows.length > 0) {
              const sumRatio = totalProfitTimesQuantity / fatigueValueCommon;

              resultSets.push({
                aFolderName: dataA.folderName,
                bFolderName: dataB.folderName,
                fatigueVal: fatigueValueCommon,
                sumRatio: sumRatio,
                rows: comparisonRows,
              });
            }
          }
        }

        // ペア探索
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

        finalPairs.forEach((card) => {
          const [folder1, folder2] = card.pairKey.split("|");

          // カード領域
          const cardDiv = document.createElement("div");
          cardDiv.className = "pair-card";
          outputContainer.appendChild(cardDiv);

          const cardTitle = document.createElement("h2");
          cardTitle.textContent = `${folder1} ↔ ${folder2}(販売個数×利益/消費疲労値(往復): ${card.avgRatio})`;
          cardDiv.appendChild(cardTitle);

          // A→B表示
          {
            const set = card.AtoB;
            const subtitleAtoB = document.createElement("h3");
            subtitleAtoB.textContent = `${set.aFolderName} → ${set.bFolderName}(消費疲労値${set.fatigueVal}) 販売個数×利益/消費疲労値(片道): ${set.sumRatio}`;
            cardDiv.appendChild(subtitleAtoB);

            const tableContainerAtoB = document.createElement("div");
            cardDiv.appendChild(tableContainerAtoB);
            renderTable(cardTitle, subtitleAtoB, tableContainerAtoB, set.rows);
          }

          // B→A表示
          {
            const set = card.BtoA;
            const subtitleBtoA = document.createElement("h3");
            subtitleBtoA.textContent = `${set.aFolderName} → ${set.bFolderName}(消費疲労値${set.fatigueVal}) 販売個数×利益/消費疲労値(片道): ${set.sumRatio}`;
            cardDiv.appendChild(subtitleBtoA);

            const tableContainerBtoA = document.createElement("div");
            cardDiv.appendChild(tableContainerBtoA);
            renderTable(cardTitle, subtitleBtoA, tableContainerBtoA, set.rows);
          }
        });
      })
      .catch((error) => {
        console.error("ConsumptionFatigueLevel.csvの読み込みに失敗:", error);
      });
  });
});
