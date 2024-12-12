import os
import json
import csv
from datetime import datetime

class Capture:
    def __init__(self):
        # 保存先のフォルダを定義
        self.output_dir = "pack"
        self.json_file = "HomeGoodsQuotationFactory_translated.json"
        self.output_csv = "output.csv"
        # 保存先フォルダが存在しない場合は作成
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)

    def response(self, flow):
        """
        HTTPレスポンスデータをそのまま保存し、CSV出力処理を実行する。
        """
        # ターゲットURLとパラメータ
        target_url = "https://jp-prd-rzns.gameduchy.com/api/"
        target_method = "method=station.goods_info"

        # 条件: 指定のURLおよびメソッドを含むリクエスト
        if flow.request.url.startswith(target_url) and target_method in flow.request.content.decode("utf-8"):
            try:
                # 保存先のファイル名を生成
                output_file = os.path.join(self.output_dir, "raw_response.bin")
                
                # レスポンスデータをそのまま保存
                with open(output_file, "wb") as f:
                    f.write(flow.response.content)
                
                print(f"データを {output_file} に保存しました")
                
                # 保存後にCSV書き出し処理を実行
                self.process_and_save_csv(output_file)

            except Exception as e:
                print(f"保存エラー: {e}")

    def load_json_file(self, filepath):
        """指定されたJSONファイルをロード"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"{filepath} が見つかりません")
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def process_and_save_csv(self, raw_response_file):
        """raw_response.bin と JSON を解析し CSV を保存"""
        try:
            # raw_response.bin をロード
            with open(raw_response_file, "rb") as f:
                response_data = json.loads(f.read())

            # HomeGoodsQuotationFactory_translated.json をロード
            reference_data = self.load_json_file(self.json_file)

            # データ処理
            results = []
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            user_info = response_data.get("user_info", {})
            uid = user_info.get("uid")

            # UIDリストを作成
            allowed_uids = ["9910460194", "1234567890", "9876543210"]  # 許可されたUIDをリストで定義

            # UIDがリストに含まれていない場合は処理をスキップ
            if uid not in allowed_uids:
                print(f"UID {uid} は許可されていません。処理をスキップします。")
                return

            goods_price = response_data.get("goods_price", {})
            
            for price_type in ["sell_price", "buy_price"]:
                price_data = goods_price.get(price_type, {})
                for id_key, price_info in price_data.items():
                    print(f"現在処理中のID: {id_key}")
                    
                    try:
                        # リスト内で該当する ID を検索 (整数として比較)
                        reference_item = next(
                            (item for item in reference_data if int(item.get("id", 0)) == int(id_key)),
                            None
                        )
                    except ValueError as e:
                        print(f"IDの比較中にエラーが発生しました: {e}")
                        continue  # エラー発生時は次のループに進む

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
                    else:
                        print(f"ID {id_key} に対応するアイテムが見つかりませんでした")

            # 結果をCSVに保存
            self.save_to_csv(results)

        except Exception as e:
            print(f"CSV出力処理でエラーが発生しました: {e}")


    def save_to_csv(self, data):
        """データをCSV形式で保存"""
        fieldnames = ["都市名", "売りor買い", "商品名", "値段", "傾向", "更新時間"]
        with open(self.output_csv, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        print(f"{self.output_csv} にデータを保存しました")


# mitmproxyのアドオンとして登録
addons = [Capture()]
