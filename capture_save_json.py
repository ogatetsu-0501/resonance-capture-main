import os
import json
import msgpack
from datetime import datetime, timedelta

class Capture:
    def __init__(self):
        # データを保存するフォルダの名前
        self.base_dir = "価格"  # フォルダ名を「価格」に設定
        self.msgpack_file = os.path.join(self.base_dir, "market_data.msgpack")  # MessagePackファイルのパス
        self.json_file = "HomeGoodsQuotationFactory_translated.json"  # JSONファイルの名前
        self.factory_json_file = "HomeGoodsFactory.json"  # 工場JSONファイルの名前
        self.sale_items_file = "sale_item.csv"  # 販売アイテムCSVファイルの名前

        # データを保存するフォルダが存在しない場合は作成する
        if not os.path.exists(self.base_dir):
            os.makedirs(self.base_dir)
            print(f"フォルダ '{self.base_dir}' を作成しました。")

    def response(self, flow):
        """
        HTTPレスポンスデータを保存し、MessagePackファイルに追加する処理を実行します。
        """
        # 監視するターゲットのURLとメソッド
        target_url = "https://jp-prd-rzns.gameduchy.com/api/"
        target_method = "method=station.goods_info"

        # リクエストがターゲットのURLとメソッドに一致するか確認
        if flow.request.url.startswith(target_url) and target_method in flow.request.content.decode("utf-8"):
            try:
                # レスポンスデータをバイナリファイルとして保存
                output_file = os.path.join(self.base_dir, "raw_response.bin")
                with open(output_file, "wb") as f:
                    f.write(flow.response.content)
                print(f"データを {output_file} に保存しました。")

                # 保存したバイナリファイルを読み込み、MessagePackファイルに追加
                with open(output_file, "rb") as f:
                    response_data = json.load(f)
                self.process_and_append_msgpack(response_data)

            except Exception as e:
                print(f"データ保存中にエラーが発生しました: {e}")

    def load_json_file(self, filepath):
        """
        指定されたJSONファイルを読み込みます。
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"{filepath} が見つかりません。")
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def load_sale_items(self):
        """
        sale_item.csvから商品名を読み込みます。
        """
        sale_items_path = os.path.join(self.base_dir, self.sale_items_file)
        sale_items = set()
        if not os.path.exists(sale_items_path):
            print(f"{self.sale_items_file} が見つかりません。空のリストを使用します。")
            return sale_items
        try:
            with open(sale_items_path, "r", encoding="utf-8") as f:
                for line in f:
                    item = line.strip()
                    if item:
                        sale_items.add(item)
            print(f"{self.sale_items_file} から {len(sale_items)} 件のアイテムをロードしました。")
        except Exception as e:
            print(f"{self.sale_items_file} の読み取り中にエラーが発生しました: {e}")
        return sale_items

    def process_and_append_msgpack(self, response_data):
        """
        レスポンスデータとJSONデータを解析し、MessagePackファイルに追加します。
        古いデータ（1週間以上前）は削除します。
        """
        try:
            # JSONファイルを読み込む
            reference_data = self.load_json_file(self.json_file)
            factory_data = self.load_json_file(self.factory_json_file)
            sale_items = self.load_sale_items()

            # データを保存するリストを作成
            results = []
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # レスポンスデータから価格情報を取得
            goods_price = response_data.get("goods_price", {})

            for price_type in ["sell_price", "buy_price"]:
                price_data = goods_price.get(price_type, {})
                for id_key, price_info in price_data.items():
                    try:
                        # 参照データから該当するIDを検索
                        reference_item = next(
                            (item for item in reference_data if int(item.get("id", 0)) == int(id_key)),
                            None
                        )
                    except ValueError as e:
                        print(f"IDの比較中にエラーが発生しました: {e}")
                        continue

                    if reference_item:
                        idCN = reference_item.get("idCN", "").split("/")
                        goods_id = reference_item.get("goodsId")
                        num = reference_item.get("num")  # 販売個数を取得

                        # 工場データから特産品情報を検索
                        speciality = "通常品"
                        if goods_id:
                            factory_item = next(
                                (item for item in factory_data if item.get("id") == goods_id),
                                None
                            )
                            if factory_item:
                                speciality = "特産品" if factory_item.get("isSpeciality") else "通常品"

                        if len(idCN) >= 3:
                            city, transaction_type, product_name = idCN[:3]

                            # 都市名が「（废弃）」の場合はデータをスキップ
                            if city == "（废弃）":
                                print(f"廃棄データをスキップしました: ID {id_key}, 都市名 {city}")
                                continue

                            # 売りまたは買いに応じて取引タイプを設定
                            transaction_type = "買い" if price_type == "sell_price" else "売り"

                            # データをリストに追加
                            results.append({
                                "都市名": city,
                                "売りor買い": transaction_type,
                                "商品名": product_name,
                                "値段": price_info.get("price"),
                                "傾向": price_info.get("trend"),
                                "倍率": price_info.get("quota"),
                                "販売個数": num,
                                "特産品": speciality,
                                "更新時間": timestamp
                            })

            # 既存のMessagePackデータを読み込む
            existing_data = self.load_from_msgpack(self.msgpack_file)

            # 新しいデータを追加
            existing_data.extend(results)

            # 古いデータ（1週間以上前）を削除
            one_week_ago = datetime.now() - timedelta(weeks=1)
            filtered_data = [entry for entry in existing_data if self.is_recent(entry["更新時間"], one_week_ago)]

            # フィルタリングされたデータをMessagePackファイルに保存
            self.save_to_msgpack(filtered_data, self.msgpack_file)
            print(f"MessagePackファイルにデータを保存しました。現在のデータ数: {len(filtered_data)}")

        except Exception as e:
            print(f"MessagePackへの保存中にエラーが発生しました: {e}")

    def is_recent(self, update_time_str, cutoff_datetime):
        """
        更新時間が1週間以内かどうかを確認します。
        """
        try:
            update_time = datetime.strptime(update_time_str, "%Y-%m-%d %H:%M:%S")
            return update_time >= cutoff_datetime
        except ValueError:
            # 日時の形式が正しくない場合は古いデータとみなす
            print(f"無効な日時形式のデータをスキップしました: {update_time_str}")
            return False

    def save_to_msgpack(self, data, filepath):
        """
        データをMessagePack形式でファイルに保存します。
        """
        try:
            with open(filepath, "wb") as f:
                packed = msgpack.packb(data, use_bin_type=True)
                f.write(packed)
            print(f"データを {filepath} にMessagePack形式で保存しました。")
        except Exception as e:
            print(f"MessagePack保存中にエラーが発生しました: {e}")

    def load_from_msgpack(self, filepath):
        """
        MessagePack形式のファイルからデータを読み込みます。
        ファイルが存在しない場合は空のリストを返します。
        """
        if not os.path.exists(filepath):
            print(f"{filepath} が見つかりません。新しいファイルを作成します。")
            return []
        try:
            with open(filepath, "rb") as f:
                data = msgpack.unpackb(f.read(), raw=False)
            print(f"{filepath} からデータを読み込みました。データ数: {len(data)}")
            return data
        except Exception as e:
            print(f"MessagePack読み込み中にエラーが発生しました: {e}")
            return []

    def __del__(self):
        """
        クラスのインスタンスが削除される際に呼ばれます。必要に応じてクリーンアップ処理を行います。
        """
        print("Captureクラスのインスタンスが削除されました。")

# mitmproxyのアドオンとして登録
addons = [Capture()]
