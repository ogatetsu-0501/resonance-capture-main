import os
import json
import csv
import itertools
import threading
from datetime import datetime
from ppadb.client import Client as AdbClient
import time
from mitmproxy import ctx
import keyboard  # キーボード入力を監視

class Capture:
    def __init__(self):
        self.output_dir = "pack"
        self.json_file = "HomeGoodsQuotationFactory_translated.json"
        self.output_csv = "output.csv"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def response(self, flow):
        """
        HTTPレスポンスデータをキャプチャし、CSVに保存。
        """
        target_url = "https://jp-prd-rzns.gameduchy.com/api/"
        target_method = "method=station.goods_info"

        if flow.request.url.startswith(target_url) and target_method in flow.request.content.decode("utf-8"):
            try:
                # レスポンスデータを保存
                response_data = json.loads(flow.response.content)
                ctx.log.info(f"Captured response: {response_data}")
                self.process_and_save_csv(response_data)
            except Exception as e:
                ctx.log.error(f"Error processing response: {e}")

    def load_json_file(self, filepath):
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"{filepath} が見つかりません")
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def process_and_save_csv(self, response_data):
        try:
            reference_data = self.load_json_file(self.json_file)
            results = []
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            user_info = response_data.get("user_info", {})
            uid = user_info.get("uid")

            if uid != "9910460194":
                ctx.log.info("対象のUIDではありませんでした。")
                return

            goods_price = response_data.get("goods_price", {})

            for price_type in ["sell_price", "buy_price"]:
                price_data = goods_price.get(price_type, {})
                for id_key, price_info in price_data.items():
                    try:
                        reference_item = next(
                            (item for item in reference_data if int(item.get("id", 0)) == int(id_key)),
                            None
                        )
                    except ValueError as e:
                        ctx.log.error(f"ID比較中にエラー: {e}")
                        continue

                    if reference_item:
                        idCN = reference_item.get("idCN", "").split("/")
                        if len(idCN) >= 3:
                            city, transaction_type, product_name = idCN[:3]
                            results.append({
                                "都市名": city,
                                "売りor買い": transaction_type,
                                "商品名": product_name,
                                "値段": price_info.get("price"),
                                "傾向": price_info.get("trend"),
                                "更新時間": timestamp
                            })

            self.save_to_csv(results)
        except Exception as e:
            ctx.log.error(f"CSV出力処理でエラー: {e}")

    def save_to_csv(self, data):
        fieldnames = ["都市名", "売りor買い", "商品名", "値段", "傾向", "更新時間"]
        with open(self.output_csv, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        ctx.log.info(f"{self.output_csv} にデータを保存しました")

class AutomatedActions:
    def __init__(self):
        self.input1_loops = ["入力①_1A", "入力①_1B", "入力①_1C"]
        self.input1_cycle = itertools.cycle(self.input1_loops)
        self.loop_index = 0

        # ADBクライアントの設定
        ADB_PATH = r"C:\Program Files\Netease\MuMuPlayerGlobal-12.0\shell"
        os.environ["PATH"] += os.pathsep + ADB_PATH
        self.client = AdbClient(host="127.0.0.1", port=5037)
        MUMU_IP = "127.0.0.1"
        MUMU_PORT = 7555

        try:
            self.client.remote_connect(MUMU_IP, MUMU_PORT)
            self.device = self.client.device(f"{MUMU_IP}:{MUMU_PORT}")
            if not self.device:
                raise Exception("No devices connected.")
            ctx.log.info(f"Connected to device: {self.device.serial}")
        except Exception as e:
            ctx.log.error(f"ADB接続エラー: {e}")
            self.device = None

    def tap(self, x, y):
        if self.device:
            command = f"input tap {x} {y}"
            self.device.shell(command)
            ctx.log.info(f"Tapped at ({x}, {y})")

    def send_text(self, text):
        if self.device:
            command = f"input text '{text}'"
            self.device.shell(command)
            ctx.log.info(f"Text input: {text}")

    def press_key(self, key_code):
        if self.device:
            command = f"input keyevent {key_code}"
            self.device.shell(command)
            ctx.log.info(f"Key pressed: {key_code}")

    def wait_n_seconds(self, n):
        ctx.log.info(f"Waiting for {n} seconds...")
        time.sleep(n)

    def run(self):
        while True:
            self.loop_index += 1
            ctx.log.info(f"Starting loop {self.loop_index}")
            input1_value = next(self.input1_cycle)

            # 操作ロジック
            self.tap(1411, 620)
            self.tap(1451, 440)
            self.tap(1045, 407)

            self.tap(250, 43)
            self.tap(50, 822)
            self.tap(1161, 629)

            self.tap(1340, 50)
            self.tap(825, 349)
            self.tap(845, 839)

            ctx.log.info(f"Processing input① for loop {self.loop_index}: {input1_value}")
            self.send_text(input1_value)
            self.press_key(66)

            self.tap(1530, 843)

            self.tap(730, 443)
            self.tap(454, 856)

            input2_value = "12345qwert"
            self.send_text(input2_value)
            self.press_key(66)

            self.tap(152, 839)
            self.tap(976, 662)
            self.tap(807, 537)

            self.tap(776, 562)

            ctx.log.info(f"Completed loop {self.loop_index}")
            self.wait_n_seconds(2)


running = True

def key_monitor():
    """
    Shift + Space を検出してプログラムを終了する。
    """
    global running
    while running:
        if keyboard.is_pressed("shift") and keyboard.is_pressed("space"):
            ctx.log.info("Shift + Space detected. Stopping script...")
            running = False
            break

# 無限ループ操作を別スレッドで開始
automated_actions = AutomatedActions()
addons = [Capture()]

thread = threading.Thread(target=automated_actions.run, daemon=True)
thread.start()

# キーボード監視スレッドを開始
key_thread = threading.Thread(target=key_monitor, daemon=True)
key_thread.start()
