from flask import Flask, jsonify, send_from_directory
import os
import glob

app = Flask(__name__)

BASE_DIR = "価格"  # ベースフォルダの名前

@app.route('/latest-csv/<town>', methods=['GET'])
def get_latest_csv(town):
    """
    指定された町の最新CSVファイルを取得するエンドポイント
    """
    town_dir = os.path.join(BASE_DIR, town)

    if not os.path.exists(town_dir):
        return jsonify({"error": f"{town} フォルダが存在しません"}), 404

    # 指定ディレクトリ内のCSVファイルを取得
    csv_files = glob.glob(os.path.join(town_dir, "*.csv"))
    if not csv_files:
        return jsonify({"error": "CSVファイルが見つかりません"}), 404

    # 最新のCSVファイルを選択
    latest_file = max(csv_files, key=os.path.getctime)
    latest_filename = os.path.basename(latest_file)

    return jsonify({"latest_file": latest_filename})

@app.route('/download/<town>/<filename>', methods=['GET'])
def download_csv(town, filename):
    """
    CSVファイルをダウンロードするエンドポイント
    """
    town_dir = os.path.join(BASE_DIR, town)
    return send_from_directory(town_dir, filename)

if __name__ == '__main__':
    app.run(debug=True)
