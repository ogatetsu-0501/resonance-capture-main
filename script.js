async function fetchLatestCsv(town) {
  try {
    // 最新ファイル名を取得
    const response = await fetch(`/latest-csv/${town}`);
    const data = await response.json();

    if (data.error) {
      alert(data.error);
      return;
    }

    const latestFile = data.latest_file;
    console.log(`最新のファイル名: ${latestFile}`);

    // 最新CSVファイルをダウンロードして処理
    const csvResponse = await fetch(`/download/${town}/${latestFile}`);
    const csvText = await csvResponse.text();
    processCsv(csvText); // CSVデータの処理関数を呼び出し
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

// 都市名を指定してCSVを読み込む
fetchLatestCsv("アニタエネルギーラボ");
