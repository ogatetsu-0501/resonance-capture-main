import os
from ppadb.client import Client as AdbClient
import time
from datetime import datetime, timedelta
import pandas as pd
import json
import subprocess
import pygetwindow as gw

# ADBツールのパスを環境変数に追加する(コンピュータがADBを見つけられるようにする)
ADB_PATH = r"C:\\Program Files\\Netease\\MuMuPlayerGlobal-12.0\\shell"
os.environ["PATH"] += os.pathsep + ADB_PATH  # PATHにADBの場所を追加する

# ADBサービスを再起動する関数(ADBが動かないとき直すため)
def restart_adb_service():
    # ADBを一旦止めるコマンドを実行する(ADBが動いていてもリセットする)
    subprocess.run([r"C:\\Program Files\\Netease\\MuMuPlayerGlobal-12.0\\shell\\adb.exe", "kill-server"])
    # ADBを起動するコマンドを実行する(ADBを再スタートさせる)
    subprocess.run([r"C:\\Program Files\\Netease\\MuMuPlayerGlobal-12.0\\shell\\adb.exe", "start-server"])
    time.sleep(3)  # 少し待ってADBが安定して起動するのを待つ

# ADBクライアントの初期化(スマホやエミュレータに接続するためのお手伝い)
restart_adb_service()  # ADBサービスを再起動しておく
client = AdbClient(host="127.0.0.1", port=5037)  # ADBクライアントを作る

# MuMu Playerを最小化する関数
def minimize_mumu_player():
    print("Minimizing MuMu Player...")
    try:
        # MuMu Playerのウィンドウを探して最小化
        windows = gw.getWindowsWithTitle("MuMu")
        if windows:
            for window in windows:
                window.minimize()
            print("MuMu Player minimized.")
        else:
            print("MuMu Player window not found.")
    except Exception as e:
        # 最小化に失敗した場合のエラー
        print(f"Failed to minimize MuMu Player: {e}")
        exit()

# MuMu Playerを再起動する関数
def restart_mumu_player():
    # MuMu Playerを再起動するよ
    print("Restarting MuMu Player...")
    try:
        # MuMuPlayer.exeを強制終了する(一旦止める)
        # もしMuMuPlayer.exeが見つからなかったとしてもエラーを無視して次へ進むようにする(check=False)
        subprocess.run(["taskkill", "/IM", "MuMuPlayer.exe", "/F"], check=False)
        time.sleep(5)  # ちゃんと止まったかもしれないのでちょっと待つ
        # MuMu Playerを起動する(また動かす)
        subprocess.Popen([r"C:\\Program Files\\Netease\\MuMuPlayerGlobal-12.0\\shell\\MuMuPlayer.exe"])
        time.sleep(30)  # 起動が終わるまで待つ
        # ADBを使ってMuMu Playerとつなげる（リモート接続）
        client.remote_connect("127.0.0.1", 7555)
        print("MuMu Player restarted and reconnected successfully.")
        minimize_mumu_player()  # 再起動後に最小化する
    except subprocess.CalledProcessError as e:
        # MuMuPlayer.exeを終了できなかった場合のエラー
        print(f"Failed to restart MuMu Player: {e.output}")
        exit()
    except Exception as e:
        # それ以外の予期しないエラーが起きたとき
        print(f"Unexpected error while restarting MuMu Player: {e}")
        exit()

# ゲームを起動する関数
def start_game(device):
    # ゲームを起動する
    print("Starting game...")
    try:
        tap(device, 248, 668)  # ゲームアイコンがある場所をタップ
        time.sleep(10)  # ゲームが開くまで待つ
        tap(device, 844, 480)  # ゲーム画面で最初にタップする場所(例えばログインボタン)
        time.sleep(10)
        print("Game started.")
    except Exception as e:
        # ゲームが起動できなかった場合のエラーを表示
        print(f"Failed to start game: {e}")
        exit()

# MuMu Playerへ接続するための情報
MUMU_IP = "127.0.0.1"  # MuMu Playerは自分のパソコン内で動くので127.0.0.1(自分自身)
MUMU_PORT = 7555       # MuMu Playerの接続ポート

def connect_to_mumu():
    # MuMu Playerに接続するよ
    try:
        client.remote_connect(MUMU_IP, MUMU_PORT)  # 指定のIPとポートに接続
        print(f"Successfully connected to {MUMU_IP}:{MUMU_PORT}")
    except Exception as e:
        # 接続できなかった場合はエラー
        print(f"Failed to connect to {MUMU_IP}:{MUMU_PORT}: {e}")
        exit()

# デバイスが接続できているか確認する関数
def check_device():
    # ADBクライアントからデバイスを取得する
    device = client.device(f"{MUMU_IP}:{MUMU_PORT}")
    if not device:
        # 見つからなかった場合は注意喚起
        print("No devices connected. Please check MuMu Player and try again.")
        exit()
    # 接続できたデバイスを表示する
    print(f"Connected to device: {device.serial}")
    return device

WAIT_TIME = 2  # タップや入力の後、少し待つ秒数

def tap(device, x, y):
    # 画面上の(x, y)をタップする
    command = f"input tap {x} {y}"
    device.shell(command)  # デバイスにコマンドを送る
    print(f"Tapped at ({x}, {y})")
    time.sleep(WAIT_TIME)  # ちょっと待つ

def send_text(device, text):
    # テキスト入力コマンドを送る
    command = f"input text '{text}'"
    device.shell(command)
    print(f"Text input: {text}")
    time.sleep(WAIT_TIME)

def press_key(device, key_code):
    # キーボードイベントを送る(key_codeはボタン番号)
    command = f"input keyevent {key_code}"
    device.shell(command)
    print(f"Key pressed: {key_code}")
    time.sleep(WAIT_TIME)

# リンクコードを使った処理を行う関数
def execute_linkage(device, link_codes, password):
    print(f"Starting linkage process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    for link_code in link_codes:
        print(f"Processing linkage with code: {link_code}")
        tap(device, 1350, 50)   # 設定や入力画面へ行くボタンをタップ
        tap(device, 818, 344)   # コード入力欄へ行くためのタップ
        time.sleep(5)
        send_text(device, link_code)  # リンクコードを入力
        tap(device, 1516, 844)  # OKボタンを押す
        tap(device, 789, 449)   # パスワード入力欄へ行くためのタップ
        send_text(device, password)   # パスワードを入力
        tap(device, 1516, 844)  # OKボタンを押す
        tap(device, 973, 655)   # リンク実行ボタンを押す
        tap(device, 804, 551)   # 確認ボタンを押す
        tap(device, 804, 551)   # 確認をもう一度押す
        time.sleep(10)          # リンクが終わるのを待つ
        tap(device, 912, 63)    # 戻るボタンを何回か押して前の画面へ
        tap(device, 912, 63)
        tap(device, 912, 63)
        tap(device, 912, 63)
        tap(device, 912, 63)
        tap(device, 912, 63)
    print("Linkage process completed.")

# トレード(取引)を行う処理
def execute_trade(device, trade_coords):
    print(f"Starting trade process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    tap(device, 1461, 620)  # トレード画面へ行くボタン
    time.sleep(3)
    for coord in trade_coords:
        tap(device, coord[0], coord[1])  # 商品の場所をタップ
    time.sleep(3)
    tap(device, 1150, 398)  # トレード確定ボタン
    time.sleep(3)
    tap(device, 98, 50)     # 戻るボタンを連打して前の画面に戻る
    tap(device, 98, 50)
    tap(device, 98, 50)
    print("Trade process completed.")

# ログアウトする処理
def execute_logout(device):
    print(f"Starting logout process at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    time.sleep(3)
    tap(device, 194, 836)  # メニューを開くボタン
    time.sleep(3)
    tap(device, 55, 821)   # ログアウトボタン
    tap(device, 1176, 630) # 確認ボタン
    time.sleep(5)
    print("Logout process completed.")

# 消費疲労度をCSVから読み込む関数
def load_consumption_fatigue():
    consumption_fatigue_file = "ConsumptionFatigueLevel.csv"
    if os.path.exists(consumption_fatigue_file):
        return pd.read_csv(consumption_fatigue_file, index_col=0)
    else:
        return pd.DataFrame()

# 最新の都市データを読み込む関数(価格フォルダから読み込む)
def get_latest_city_data():
    data_folder = "価格"
    city_data = {}
    if os.path.exists(data_folder):
        for city_name in os.listdir(data_folder):
            city_folder = os.path.join(data_folder, city_name)
            if os.path.isdir(city_folder):
                output_csv_path = os.path.join(city_folder, "output.csv")
                if os.path.exists(output_csv_path):
                    city_data[city_name] = pd.read_csv(output_csv_path)
    return city_data

# 利益を計算する関数(仕入れと売値を比べて利益が出るか計算)
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

# GitコマンドをPython内で実行する関数
def run_git_commands():
    # Git関連のコマンドをPythonから実行する
    # フォルダをGitリポジトリとして初期化
    subprocess.run(["git", "init"], check=True)
    # すべてのファイルをステージする
    subprocess.run(["git", "add", "."], check=True)
    # コミットを作成
    subprocess.run(["git", "commit", "-m", "Add csv"], check=True)
    # リモートリポジトリを追加
    subprocess.run(["git", "remote", "add", "origin", "https://github.com/ogatetsu-0501/resonance-capture-main.git"], check=False)
    # リモートへプッシュ
    subprocess.run(["git", "push", "-u", "origin", "main"], check=False)
    print("Git commands executed.")

# メインの処理
if __name__ == "__main__":
    next_execution_time = datetime.now()  # 次に処理する時間を現在時刻に設定
    while True:
        print(next_execution_time)
        current_time = datetime.now()  # 現在の時間を取得
        if current_time >= next_execution_time:
            # 一定時間ごとにやりたい処理(15分ごと)
            next_execution_time = current_time + timedelta(minutes=15)
            restart_mumu_player()      # MuMu Player再起動して最小化
            connect_to_mumu()          # MuMu Playerへ接続
            device = check_device()    # デバイス取得
            start_game(device)         # ゲームを起動
            # リンク用のデータ(コードと座標のセット)
            linkage_data = [
                ("Re733761K103494q", (810, 190)),
                ("Rq733832C901737e", (1242, 256)),
                ("Pq733841m008770I", (1425, 432)),
                ("Qx734105j098469X", (147, 513)),
                ("nQ733931N031265t", (808, 370)),
                ("Qx734105j098469X", (147, 513)),
                ("Vh734185C444443y", (690, 315)),
                ("Dn732906X231569a", (540, 610))
            ]
            test_password = "12345qwert"  # テスト用パスワード

            for link_code, trade_coord in linkage_data:
                execute_linkage(device, [link_code], test_password)  # リンク処理
                execute_trade(device, [trade_coord])                # トレード処理
                execute_logout(device)                               # ログアウト処理

            calculate_profits()  # 利益計算

            # ここでGitコマンドをPython内で実行する
            # コードがひととおり終わった後、変更をGitHubにプッシュするため
            run_git_commands()

        time.sleep(1)  # 1秒待ってからまたチェックする
