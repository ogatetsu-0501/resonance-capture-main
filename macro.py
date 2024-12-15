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
        subprocess.run(["taskkill", "/IM", "MuMuPlayer.exe", "/F"], check=True)
        time.sleep(5)  # 確実に終了するまで待機
        subprocess.Popen([r"C:\\Program Files\\Netease\\MuMuPlayerGlobal-12.0\\shell\\MuMuPlayer.exe"])
        time.sleep(30)  # 起動完了まで待機
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
        tap(device, 248, 668)  # ゲームアイコンをタップ
        time.sleep(10)  # ゲーム起動待機
        tap(device, 844, 480)  # ゲーム画面で初期タップ
        time.sleep(10)
        print("Game started.")
    except Exception as e:
        print(f"Failed to start game: {e}")
        exit()

# MuMu Playerに接続
MUMU_IP = "127.0.0.1"
MUMU_PORT = 7555

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

WAIT_TIME = 1

def tap(device, x, y):
    command = f"input tap {x} {y}"
    device.shell(command)
    print(f"Tapped at ({x}, {y})")
    time.sleep(WAIT_TIME)

def send_text(device, text):
    command = f"input text '{text}'"
    device.shell(command)
    print(f"Text input: {text}")
    time.sleep(WAIT_TIME)

def press_key(device, key_code):
    command = f"input keyevent {key_code}"
    device.shell(command)
    print(f"Key pressed: {key_code}")
    time.sleep(WAIT_TIME)

def execute_linkage(device, link_codes, password):
    print(f"Starting linkage process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    for link_code in link_codes:
        print(f"Processing linkage with code: {link_code}")
        tap(device, 1350, 50)
        tap(device, 818, 344)
        send_text(device, link_code)
        tap(device, 1516, 844)
        tap(device, 789, 449)
        send_text(device, password)
        tap(device, 1516, 844)
        tap(device, 973, 655)
        tap(device, 804, 551)
        tap(device, 804, 551)
        time.sleep(5)
        tap(device, 912, 63)
        tap(device, 912, 63)
        tap(device, 912, 63)
        tap(device, 912, 63)
        tap(device, 912, 63)
    print("Linkage process completed.")

def execute_trade(device, trade_coords):
    print(f"Starting trade process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    tap(device, 1461, 620)
    time.sleep(3)
    for coord in trade_coords:
        tap(device, coord[0], coord[1])
    time.sleep(3)
    tap(device, 1150, 398)
    time.sleep(3)
    tap(device, 98, 50)
    tap(device, 98, 50)
    tap(device, 98, 50)
    print("Trade process completed.")

def execute_logout(device):
    print(f"Starting logout process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    time.sleep(3)
    tap(device, 194, 836)
    time.sleep(3)
    tap(device, 55, 821)
    tap(device, 1176, 630)
    time.sleep(5)
    print("Logout process completed.")

def load_consumption_fatigue():
    consumption_fatigue_file = "ConsumptionFatigueLevel.csv"
    if os.path.exists(consumption_fatigue_file):
        return pd.read_csv(consumption_fatigue_file, index_col=0)
    else:
        return pd.DataFrame()

def get_latest_city_data():
    data_folder = "価格"
    city_data = {}
    for city_name in os.listdir(data_folder):
        city_folder = os.path.join(data_folder, city_name)
        if os.path.isdir(city_folder):
            output_csv_path = os.path.join(city_folder, "output.csv")
            if os.path.exists(output_csv_path):
                city_data[city_name] = pd.read_csv(output_csv_path)
    return city_data

def calculate_profits():
    city_data = get_latest_city_data()
    results = []
    for buy_city, buy_data in city_data.items():
        buy_data_filtered = buy_data[buy_data['売りor買い'] == '買い']
        for sell_city, sell_data in city_data.items():
            if buy_city == sell_city:
                continue
            sell_data_filtered = sell_data[sell_data['売りor買い'] == '売り']
            merged_data = pd.merge(buy_data_filtered, sell_data_filtered, on="商品名", suffixes=("_buy", "_sell"))
            merged_data["利益"] = (merged_data["値段_sell"] - merged_data["値段_buy"]) * merged_data["販売個数_buy"]
            profitable_data = merged_data[merged_data["利益"] > 0]
            if not profitable_data.empty:
                results.append(profitable_data)
    if results:
        print(f"Calculation complete. Results: {results}")

if __name__ == "__main__":
    next_execution_time = datetime.now()
    while True:
        print(next_execution_time)
        current_time = datetime.now()
        if current_time >= next_execution_time:
            next_execution_time = current_time + timedelta(minutes=15)
            restart_mumu_player()
            connect_to_mumu()
            device = check_device()
            start_game(device)
            linkage_data = [
                ("Re733761K103494q", (810, 190)),
                ("Rq733832C901737e", (1242, 256)),
                ("Pq733841m008770I", (1425, 432)),
                ("Qx734105j098469X", (147, 513)),
                ("nQ733931N031265t", (808, 370)),
                ("Qx734105j098469X", (147, 513)),
                ("Vh734185C444443y", (690, 315))
            ]
            test_password = "12345qwert"
            for link_code, trade_coord in linkage_data:
                execute_linkage(device, [link_code], test_password)
                execute_trade(device, [trade_coord])
                execute_logout(device)
            calculate_profits()
        time.sleep(1)
