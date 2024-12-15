import os
from ppadb.client import Client as AdbClient
import time
from datetime import datetime, timedelta
import pandas as pd
import json
import subprocess

# ADBツールのパスを環境変数に追加
ADB_PATH = r"C:\\Program Files\\Netease\\MuMuPlayerGlobal-12.0\\shell"
os.environ["PATH"] += os.pathsep + ADB_PATH

# ADBクライアントの初期化
client = AdbClient(host="127.0.0.1", port=5037)

# MuMu Playerの再起動関数
def restart_mumu_player():
    print("Restarting MuMu Player...")
    try:
        # MuMu Playerを終了
        subprocess.run(["taskkill", "/IM", "MuMuPlayer.exe", "/F"], check=True)
        time.sleep(5)  # 確実に終了するまで待機

        # MuMu Playerを起動
        subprocess.Popen([r"C:\\Program Files\\Netease\\MuMuPlayerGlobal-12.0\\shell\\MuMuPlayer.exe"])
        time.sleep(30)  # 起動完了まで待機

        # ADB再接続
        client.remote_connect("127.0.0.1", 7555)
        print("MuMu Player restarted and reconnected successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Failed to restart MuMu Player: {e.output}")
        exit()
    except Exception as e:
        print(f"Unexpected error while restarting MuMu Player: {e}")
        exit()

# ゲームを起動する処理
def start_game(device):
    print("Starting game...")
    try:
        # ゲームアイコンをタップ
        tap(device, 248, 668)
        time.sleep(10)  # ゲーム起動待機

        # ゲーム画面での初期タップ
        tap(device, 844, 480)
        time.sleep(10)  # ゲーム起動待機
        print("Game started.")
    except Exception as e:
        print(f"Failed to start game: {e}")
        exit()

# MuMu Playerに接続
MUMU_IP = "127.0.0.1"
MUMU_PORT = 7555  # MuMu Playerのデフォルトポート

def connect_to_mumu():
    try:
        client.remote_connect(MUMU_IP, MUMU_PORT)
        print(f"Successfully connected to {MUMU_IP}:{MUMU_PORT}")
    except Exception as e:
        print(f"Failed to connect to {MUMU_IP}:{MUMU_PORT}: {e}")
        exit()

# 接続確認
def check_device():
    device = client.device(f"{MUMU_IP}:{MUMU_PORT}")
    if not device:
        print("No devices connected. Please check MuMu Player and try again.")
        exit()
    print(f"Connected to device: {device.serial}")
    return device

# 共通待機時間 (秒)
WAIT_TIME = 1

# タップ操作（指定座標をタップ）
def tap(device, x, y):
    command = f"input tap {x} {y}"
    device.shell(command)
    print(f"Tapped at ({x}, {y})")
    time.sleep(WAIT_TIME)  # 共通待機時間

# テキスト入力（文字列を入力）
def send_text(device, text):
    command = f"input text '{text}'"
    device.shell(command)
    print(f"Text input: {text}")
    time.sleep(WAIT_TIME)  # 共通待機時間

# キーイベント送信（仮想キーを押す）
def press_key(device, key_code):
    command = f"input keyevent {key_code}"
    device.shell(command)
    print(f"Key pressed: {key_code}")
    time.sleep(WAIT_TIME)  # 共通待機時間


# 連携処理の関数
def execute_linkage(device, link_codes, password):
    print(f"Starting linkage process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    for link_code in link_codes:
        print(f"Processing linkage with code: {link_code}")
        # 各座標に基づいて操作
        tap(device, 1350, 50)  # 連携ボタン
        tap(device, 818, 344)  # 連携コード入力欄
        send_text(device, link_code)  # 連携コード入力
        tap(device, 1516, 844)  # 入力確定
        tap(device, 789, 449)  # 連携パスワード入力欄
        send_text(device, password)  # 連携パスワード入力
        tap(device, 1516, 844)  # 入力確定
        tap(device, 973, 655)  # 連携確定
        tap(device, 804, 551)  # 連携完了
        tap(device, 804, 551)  # ゲームイン
        time.sleep(5)
        tap(device, 912, 63)  # ログイン受け取り
        tap(device, 912, 63)  # ログイン受け取り
        tap(device, 912, 63)  # ログイン受け取り
        tap(device, 912, 63)  # ログイン受け取り
        tap(device, 912, 63)  # ログイン受け取り
        
    print("Linkage process completed.")

# 取引処理の関数
def execute_trade(device, trade_coords):
    print(f"Starting trade process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tap(device, 1461, 620)  # 街に行く
    time.sleep(3)
    for coord in trade_coords:
        tap(device, coord[0], coord[1])  # 取引所操作（仮座標）
    time.sleep(3)
    tap(device, 1150,398) # 購入
    time.sleep(3)
    tap(device, 98, 50)  # 戻る
    tap(device, 98, 50)  # 戻る
    tap(device, 98, 50)  # 戻る

    print("Trade process completed.")

# ログアウト処理の関数
def execute_logout(device):
    print(f"Starting logout process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    time.sleep(3)
    tap(device, 194, 836)  # アイコンを押す
    time.sleep(3)
    tap(device, 55, 821)  # ログアウト
    tap(device, 1176, 630)  # ログアウト確認
    time.sleep(5)
    print("Logout process completed.")

# 消費疲労値の読み込み
def load_consumption_fatigue():
    consumption_fatigue_file = "ConsumptionFatigueLevel.csv"
    if os.path.exists(consumption_fatigue_file):
        return pd.read_csv(consumption_fatigue_file, index_col=0)
    else:
        return pd.DataFrame()

# 最新のCSVファイルを取得する関数
def get_latest_file(folder_path):
    files = [f for f in os.listdir(folder_path) if f.endswith(".csv")]
    if not files:
        return None

    def extract_timestamp(filename):
        try:
            # ファイル名のタイムスタンプを正確に抽出
            timestamp_part = filename.split("_")[1] + "_" + filename.split("_")[2].replace(".csv", "")
            return datetime.strptime(timestamp_part, "%Y-%m-%d_%H-%M-%S")
        except Exception as e:
            print(f"ファイル名の解析中にエラーが発生しました: {e}")
            return None

    # タイムスタンプが有効なファイルのみフィルタリング
    valid_files = [(f, extract_timestamp(f)) for f in files]
    valid_files = [(f, ts) for f, ts in valid_files if ts is not None]

    if not valid_files:
        print("有効なタイムスタンプを持つファイルが見つかりませんでした。")
        return None

    # 最新のタイムスタンプを持つファイルを選択
    latest_file = max(valid_files, key=lambda x: x[1])[0]
    return os.path.join(folder_path, latest_file)

# 都市フォルダ内の最新データを取得
def get_latest_city_data():
    data_folder = "価格"
    city_data = {}
    for city_name in os.listdir(data_folder):
        city_folder = os.path.join(data_folder, city_name)
        if os.path.isdir(city_folder):
            latest_file = get_latest_file(city_folder)
            if latest_file:
                print(f"都市: {city_name}, 最新ファイル: {latest_file}")
                city_data[city_name] = pd.read_csv(latest_file)
    return city_data

# 利益計算
def calculate_profits():
    data_folder = "価格"
    transaction_history_file = "TransactionHistory.json"  # JSONファイルに変更

    # 最新データの取得
    city_data = get_latest_city_data()
    fatigue_data = load_consumption_fatigue()

    results = []

    for buy_city, buy_data in city_data.items():
        buy_data_filtered = buy_data[buy_data['売りor買い'] == '買い']
        for sell_city, sell_data in city_data.items():
            if buy_city == sell_city:
                continue

            sell_data_filtered = sell_data[sell_data['売りor買い'] == '売り']

            # 商品名でフィルタリング
            merged_data = pd.merge(buy_data_filtered, sell_data_filtered, on="商品名", suffixes=("_buy", "_sell"))

            # 利益計算
            merged_data["利益"] = (merged_data["値段_sell"] - merged_data["値段_buy"]) * merged_data["販売個数_buy"]
            profitable_data = merged_data[merged_data["利益"] > 0]

            # 商品データを新しい形式で作成
            items_buy = profitable_data.apply(lambda row: {
                "商品名": row["商品名"],
                "購入数": int(row["販売個数_buy"]),  # int型に変換
                "買値": int(row["値段_buy"]),  # int型に変換
                "売値": int(row["値段_sell"]),  # int型に変換
                "差額": int(row["値段_sell"] - row["値段_buy"])  # 差額を追加
            }, axis=1).tolist()

            # 合計購入個数の計算
            total_buy_quantity = int(profitable_data["販売個数_buy"].sum())  # int型に変換

            if not profitable_data.empty:
                total_profit = int(profitable_data["利益"].sum())  # int型に変換

                # 消費疲労値の取得
                fatigue_value = fatigue_data.get(buy_city, {}).get(sell_city, 500)

                # 疲労度毎利益
                fatigue_adjusted_profit = total_profit / fatigue_value
                results.append({
                    "買い都市": buy_city,
                    "売り都市": sell_city,
                    "疲労度毎利益": fatigue_adjusted_profit,
                    "都市1合計購入個数": total_buy_quantity,
                    "都市1購入品": items_buy
                })

    # 往復利益計算
    final_results = []
    for buy_entry in results:
        for sell_entry in results:
            if (buy_entry["買い都市"] == sell_entry["売り都市"]
                    and buy_entry["売り都市"] == sell_entry["買い都市"]):
                avg_profit = (buy_entry["疲労度毎利益"] + sell_entry["疲労度毎利益"]) / 2
                total_buy_quantity_2 = sum(item["購入数"] for item in sell_entry["都市1購入品"])
                final_results.append({
                    "計算日時": datetime.now().strftime("%Y-%m-%d_%H-%M-%S"),
                    "都市1": buy_entry["買い都市"],
                    "都市2": buy_entry["売り都市"],
                    "疲労度毎利益": avg_profit,
                    "都市1合計購入個数": buy_entry["都市1合計購入個数"],
                    "都市2合計購入個数": total_buy_quantity_2,
                    "都市1購入品": buy_entry["都市1購入品"],
                    "都市2購入品": sell_entry["都市1購入品"]
                })

    # 並び替えと上位1位の抽出
    final_results.sort(key=lambda x: x["疲労度毎利益"], reverse=True)
    if final_results:
        top_result = final_results[0]  # 上位1位を取得

        # 結果をTransactionHistory.jsonに追記
        with open(transaction_history_file, "a", encoding="utf-8") as json_file:
            json.dump(top_result, json_file, ensure_ascii=False, indent=4)
            json_file.write(",\n")  # データを追記

    print("TransactionHistory.json updated.")

# メイン処理
if __name__ == "__main__":
    next_execution_time = datetime.now()

    while True:  # 無限ループを開始
        current_time = datetime.now()
        # 次回実行時間をターミナルに出力
        print(f"Next execution time: {next_execution_time}")
        if current_time >= next_execution_time:
            next_execution_time = current_time + timedelta(minutes=15)

            # MuMu Playerを再起動
            restart_mumu_player()

            # MuMu Playerに再接続
            connect_to_mumu()
            device = check_device()

            # ゲームを起動
            start_game(device)

            # 連携コードと取引座標のリスト
            linkage_data = [
                ("Re733761K103494q", (810, 190)),
                ("Rq733832C901737e", (1242, 256)),
                ("Pq733841m008770I", (1425, 432)),
                ("Qx734105j098469X", (147, 513)),
                ("nQ733931N031265t", (808, 370)),
                ("Qx734105j098469X", (147, 513)),
                ("Vh734185C444443y", (690, 315))
            ]
            test_password = "12345qwert"  # 仮の連携パスワード

            

            for link_code, trade_coord in linkage_data:
                # 連携処理
                execute_linkage(device, [link_code], test_password)  # 指定された連携コードで連携を実行

                # 取引処理
                execute_trade(device, [trade_coord])  # 指定された座標で取引を実行

                # ログアウト処理
                execute_logout(device)  # ログアウトを実行

            # 利益計算処理の実行
            print("Starting data processing...")  # データ処理の開始を通知
            calculate_profits()  # 利益計算処理を実行
            print("Data processing completed.")  # データ処理の完了を通知

            print("All processes completed successfully.")  # 全処理の完了を通知

        time.sleep(1)  # 1秒間隔で次の実行時間を確認
