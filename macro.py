import os
from ppadb.client import Client as AdbClient
import time
import itertools

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

# 待機時間
def wait_n_seconds(n):
    print(f"Waiting for {n} seconds...")
    time.sleep(n)
    print(f"Waited {n} seconds.")

# 入力①の値をループ毎に変えるための配列
input1_loops = ["入力①_1A", "入力①_1B", "入力①_1C"]

# 無限ループの設定（itertools.cycleを使用）
input1_cycle = itertools.cycle(input1_loops)  # 入力①を循環させる

loop_index = 0  # ループのカウント

# 無限ループ処理
while True:
    loop_index += 1
    print(f"Starting loop {loop_index}")

    # 入力①の値を取得
    input1_value = next(input1_cycle)

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
    print(f"Processing input① for loop {loop_index}: {input1_value}")
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

    print(f"Completed loop {loop_index}")
    wait_n_seconds(2)  # 次のループ前に2秒待機
