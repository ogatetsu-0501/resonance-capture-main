import os
import json
import csv
from datetime import datetime

class Capture:
    def __init__(self):
        # 保存先のフォルダを定義
        self.base_dir = "価格"  # ベースフォルダ名を変更
        self.json_file = "HomeGoodsQuotationFactory_translated.json"
        self.factory_json_file = "HomeGoodsFactory.json"
        # 保存先フォルダが存在しない場合は作成
        if not os.path.exists(self.base_dir):
            os.makedirs(self.base_dir)

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
                output_file = os.path.join(self.base_dir, "raw_response.bin")
                
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

            # HomeGoodsFactory.json をロード
            factory_data = self.load_json_file(self.factory_json_file)

            # データ処理
            results = []
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            date_str = datetime.now().strftime("%Y-%m-%d")

            user_info = response_data.get("user_info", {})
            uid = user_info.get("uid")
            

            goods_price = response_data.get("goods_price", {})
            
            city_counter = {}
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
                        goods_id = reference_item.get("goodsId")
                        num = reference_item.get("num")  # 販売個数を取得

                        # HomeGoodsFactory.json から特産品情報を検索
                        speciality = "通常品"
                        if goods_id:
                            factory_item = next(
                                (item for item in factory_data if item.get("id") == goods_id),
                                None
                            )
                            if factory_item:
                                speciality = "特産品" if factory_item.get("isSpeciality") else "通常品"

                        # idCNを分解して情報を追加
                        if len(idCN) >= 3:
                            city, transaction_type, product_name = idCN[:3]
                            
                            # "売り"または"買い"をprice_typeで設定
                            transaction_type = "買い" if price_type == "sell_price" else "売り"
                            
                            city_counter[city] = city_counter.get(city, 0) + 1
                            results.append({
                                "都市名": city,
                                "売りor買い": transaction_type,  # 修正点：price_typeに基づき正確に設定
                                "商品名": product_name,
                                "値段": price_info.get("price"),
                                "傾向": price_info.get("trend"),
                                "倍率": price_info.get("quota"),  # 倍率を追加
                                "販売個数": num,  # 販売個数を追加
                                "特産品": speciality,  # 特産品を追加
                                "更新時間": timestamp
                            })
                    else:
                        print(f"ID {id_key} に対応するアイテムが見つかりませんでした")


            # 都市名でデータをフィルタリング
            if city_counter:
                primary_city = max(city_counter, key=city_counter.get)  # データ数が多い都市名を選択
                results = [row for row in results if row["都市名"] == primary_city]

            # 結果をCSVに保存
            self.save_to_csv(results, primary_city, date_str)

        except Exception as e:
            print(f"CSV出力処理でエラーが発生しました: {e}")

    def save_to_csv(self, data, city, date_str):
        """データをCSV形式で追記または新規保存"""
        fieldnames = ["都市名", "売りor買い", "商品名", "値段", "傾向", "倍率", "販売個数", "特産品", "更新時間"]
        city_dir = os.path.join(self.base_dir, city)  # 都市ごとのフォルダ
        if not os.path.exists(city_dir):
            os.makedirs(city_dir)  # 都市フォルダがない場合は作成

        # タイムスタンプ形式のファイル名を生成
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        output_csv = os.path.join(city_dir, f"output_{timestamp}.csv")
        file_exists = os.path.exists(output_csv)

        with open(output_csv, "a", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()  # ファイルが存在しない場合はヘッダーを追加
            writer.writerows(data)
        print(f"{output_csv} にデータを保存しました")



# mitmproxyのアドオンとして登録
addons = [Capture()]
