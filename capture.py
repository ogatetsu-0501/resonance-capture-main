class Capture:
    def __init__(self):
        # 初期化メソッド（現状では特に初期化処理は行わない）
        pass

    def response(self, flow):
        """
        HTTPレスポンスデータを処理するメソッド。
        特定のリクエストURLとコンテンツを持つレスポンスを解析し、データをコンソールに出力する。

        Args:
            flow: mitmproxyのHTTPフローオブジェクト。
            リクエストとレスポンスのデータにアクセス可能。
        """
        # 指定したURLとリクエスト内容を持つHTTPフローを判定
        if (
            flow.request.url == "http://reso-online-ddos.soli-reso.com:9001/api/"  # URLが一致するか確認
            and "method=station.goods_info" in flow.request.content.decode("utf-8")  # リクエストに特定の文字列が含まれているか確認
        ):
            # レスポンスの内容をデコードしてPythonオブジェクトに変換
            goods_info = eval(flow.response.content.decode("utf-8"))
            # 取得した情報をコンソールに出力
            print(goods_info)


# mitmproxyのアドオンとして登録するリスト
addons = [Capture()]
