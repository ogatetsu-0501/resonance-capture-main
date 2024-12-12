from time import sleep  # 処理を一時停止するためのライブラリ
import uiautomator2 as u2  # Androidデバイス自動化ライブラリ
from cv.images import findColorInRegion, findImageInRegion  # 色・画像検出のユーティリティ関数

class Automator:
    def __init__(self, devicesName, appName):
        """
        初期化メソッド。
        指定されたデバイスに接続し、アプリを起動する。

        Args:
            devicesName: 接続するデバイスの名前（ID）
            appName: 起動するアプリ名
        """
        self.devicesName = devicesName
        self.d = u2.connect(devicesName)  # デバイスに接続
        self.sleepTime = 0.5  # 各操作後の待機時間
        self.d.app_start(appName)  # 指定されたアプリを起動

    def captureScreen(self):
        """
        スクリーンショットを取得する。
        Returns:
            スクリーンショット画像（OpenCV形式）
        """
        return self.d.screenshot(format="opencv")

    def click(self, pos):
        """
        指定された位置をクリックする。

        Args:
            pos: (x, y)形式のタップ位置
        """
        self.d.click(pos[0], pos[1])  # 指定座標をクリック
        sleep(self.sleepTime)  # 操作後に待機

    def swipe(self, pos1, pos2):
        """
        指定された2点間をスワイプする。

        Args:
            pos1: スワイプ開始位置 (x1, y1)
            pos2: スワイプ終了位置 (x2, y2)
        """
        self.d.swipe(pos1[0], pos1[1], pos2[0], pos2[1])  # スワイプ操作
        sleep(self.sleepTime)  # 操作後に待機

    def color_exist(self, color, x, y, width, height):
        """
        指定された領域内に色が存在するか確認する。

        Args:
            color: 検索する色
            x, y, width, height: 検索範囲の座標とサイズ

        Returns:
            存在する場合はTrue、それ以外はFalse
        """
        pos = findColorInRegion(self.captureScreen(), color, x, y, width, height)
        return bool(pos)  # 色が見つかった場合はTrueを返す

    def accidentResolve(self):
        """
        トラブルを解決するために特定の座標をクリックする。
        """
        self.click((450, 1590))  # トラブル対応用の固定位置をクリック

    def color_click(self, color, x, y, width, height):
        """
        指定された色が存在する場合にその位置をクリックする。

        Returns:
            成功した場合はTrue、それ以外はFalse
        """
        pos = findColorInRegion(self.captureScreen(), color, x, y, width, height)
        if pos:
            self.click(pos)
            return True
        return False

    def color_clickToAnother(self, color, x, y, width, height):
        """
        指定された色が存在する場合、その色が消えるまでクリックする。

        Returns:
            色が見つからない場合はFalse、それ以外はTrue
        """
        pos = findColorInRegion(self.captureScreen(), color, x, y, width, height)
        if not pos:
            return False
        while pos:  # 色が存在する間クリックを繰り返す
            self.click(pos)
            pos = findColorInRegion(
                self.captureScreen(), color, x, y, width, height
            )
        return True

    def templ_exist(self, template, x, y, width, height, threshold=0.9):
        """
        指定された領域内にテンプレート画像が存在するか確認する。

        Args:
            template: 検索するテンプレート画像
            x, y, width, height: 検索範囲
            threshold: 画像の一致度（0～1）

        Returns:
            存在する場合はTrue、それ以外はFalse
        """
        pos = findImageInRegion(
            self.captureScreen(), template, x, y, width, height, threshold
        )
        return bool(pos)  # テンプレートが見つかった場合はTrueを返す

    def templ_click(self, template, x, y, width, height, threshold=0.9):
        """
        指定されたテンプレート画像が存在する場合、その位置をクリックする。

        Returns:
            成功した場合はTrue、それ以外はFalse
        """
        pos = findImageInRegion(
            self.captureScreen(), template, x, y, width, height, threshold
        )
        if pos:
            self.click(pos)
            return True
        return False

    def templ_clickToAnother(self, template, x, y, width, height, threshold=0.9):
        """
        指定されたテンプレート画像が存在する場合、その画像が消えるまでクリックする。

        Returns:
            見つからない場合はFalse、それ以外はTrue
        """
        pos = findImageInRegion(
            self.captureScreen(), template, x, y, width, height, threshold
        )
        if not pos:
            return False
        while pos:  # テンプレートが存在する間クリックを繰り返す
            self.click(pos)
            pos = findImageInRegion(
                self.captureScreen(), template, x, y, width, height, threshold
            )
        return True

    def templ_waitForClick(self, template, x, y, width, height, threshold=0.9):
        """
        指定されたテンプレート画像が現れるまで待機し、出現したらクリックする。
        """
        pos = findImageInRegion(
            self.captureScreen(), template, x, y, width, height, threshold
        )
        while not pos:  # テンプレートが見つかるまで待機
            pos = findImageInRegion(
                self.captureScreen(), template, x, y, width, height, threshold
            )
        self.click(pos)  # 見つかったらクリック

    def templ_waitForClickToAnother(self, template, x, y, width, height, threshold=0.9):
        """
        指定されたテンプレート画像が現れるまで待機し、出現後、画像が消えるまでクリックする。
        """
        pos = findImageInRegion(
            self.captureScreen(), template, x, y, width, height, threshold
        )
        while not pos:  # テンプレートが見つかるまで待機
            pos = findImageInRegion(
                self.captureScreen(), template, x, y, width, height, threshold
            )
        while pos:  # テンプレートが存在する間クリックを繰り返す
            self.click(pos)
            pos = findImageInRegion(
                self.captureScreen(), template, x, y, width, height, threshold
            )

    # def showToast(self, message):
    #     ユーザーへの通知を表示する（現在はコメントアウト）
    #     self.d.toast.show(message)
