import os
from ppadb.client import Client as AdbClient
import time
import itertools
from datetime import datetime
import pandas as pd

# ADBツールのパスを環境変数に追加
ADB_PATH = r"C:\Program Files\Netease\MuMuPlayerGlobal-12.0\shell"
os.environ["PATH"] += os.pathsep + ADB_PATH

# ADBクライアントの初期化
client = AdbClient(host="127.0.0.1", port=5037)

# MuMu Playerに接続
MUMU_IP = "127.0.0.1"
MUMU_PORT = 7555  # MuMu Playerのデフォルトポート

try:
    client.remote_connect(MUMU_IP, MUMU_PORT)
    print(f"Successfully connected to {MUMU_IP}:{MUMU_PORT}")
except Exception as e:
    print(f"Failed to connect to {MUMU_IP}:{MUMU_PORT}: {e}")
    exit()

# 接続確認
device = client.device(f"{MUMU_IP}:{MUMU_PORT}")
if not device:
    print("No devices connected. Please check MuMu Player and try again.")
    exit()

print(f"Connected to device: {device.serial}")

# タップ操作（指定座標をタップ）
def tap(x, y):
    command = f"input tap {x} {y}"
    device.shell(command)
    print(f"Tapped at ({x}, {y})")

# テキスト入力（文字列を入力）
def send_text(text):
    command = f"input text '{text}'"
    device.shell(command)
    print(f"Text input: {text}")

# キーイベント送信（仮想キーを押す）
def press_key(key_code):
    command = f"input keyevent {key_code}"
    device.shell(command)
    print(f"Key pressed: {key_code}")

# 入力①の値をループ毎に変えるための配列
input1_loops = ["入力①_1A", "入力①_1B", "入力①_1C"]

# 操作を1回分実行する関数
def execute_once():
    print(f"Execution started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    for input1_value in input1_loops:
        # 最初の3回タップ
        tap(1411, 620)
        tap(1451, 440)
        tap(1045, 407)

        # 次の3回タップ
        tap(250, 43)
        tap(50, 822)
        tap(1161, 629)

        # 次の3回タップ
        tap(1340, 50)
        tap(825, 349)
        tap(845, 839)

        # 入力①（1つの値を入力）
        print(f"Processing input①: {input1_value}")
        send_text(input1_value)
        press_key(66)  # Enterキー

        # タップ1回
        tap(1530, 843)

        # 次の2回タップ
        tap(730, 443)
        tap(454, 856)

        # 入力②（指定された文字列を入力）
        input2_value = "12345qwert"
        send_text(input2_value)
        press_key(66)  # Enterキー

        # 次の3回タップ
        tap(152, 839)
        tap(976, 662)
        tap(807, 537)

        # 最後のタップ
        tap(776, 562)
    print(f"Execution completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

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
    latest_file = max(files, key=lambda x: datetime.strptime(x.split("_")[1].replace(".csv", ""), "%Y-%m-%d_%H-%M-%S"))
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
                city_data[city_name] = pd.read_csv(latest_file)
    return city_data

# 利益計算
def calculate_profits():
    data_folder = "価格"
    transaction_history_file = "TransactionHistory.csv"

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
            total_profit = profitable_data["利益"].sum()

            if total_profit > 0:
                # 消費疲労値の取得
                fatigue_value = fatigue_data.get(buy_city, {}).get(sell_city, 500)

                # 疲労度毎利益
                fatigue_adjusted_profit = total_profit / fatigue_value
                results.append((buy_city, sell_city, fatigue_adjusted_profit))

    # 往復利益計算
    final_results = []
    for buy_city, sell_city, profit1 in results:
        for sell_city2, buy_city2, profit2 in results:
            if buy_city == sell_city2 and sell_city == buy_city2:
                avg_profit = (profit1 + profit2) / 2
                final_results.append((buy_city, sell_city, avg_profit))

    # 並び替えと上位3位の抽出
    final_results.sort(key=lambda x: x[2], reverse=True)
    top_3 = final_results[:3]

    # 結果をTransactionHistory.csvに書き込み
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    history_data = pd.DataFrame(top_3, columns=["買い都市名", "売り都市名", "疲労度毎利益"])
    history_data.insert(0, "計算日時", now)

    if os.path.exists(transaction_history_file):
        existing_data = pd.read_csv(transaction_history_file)
        history_data = pd.concat([existing_data, history_data], ignore_index=True)

    history_data.to_csv(transaction_history_file, index=False)
    print("TransactionHistory.csv updated.")

# メインループ
print("Waiting for the next 10-minute mark...")
while True:
    # 現在の時間を取得
    now = datetime.now()
    # 現在の時間が10分の倍数か確認
    if now.minute % 10 == 0 and now.second == 0:
        execute_once()
        print("Waiting for the next 10-minute mark...")
        time.sleep(60)  # 1分待機して次の10分間隔を防ぐ

        # 利益計算処理の実行
        print("Starting data processing...")
        calculate_profits()
        print("Data processing completed.")

    else:
        time.sleep(1)  # 毎秒確認
