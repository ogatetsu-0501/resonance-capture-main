import cv2  # OpenCVライブラリをインポート（画像処理用）
import numpy as np  # NumPyライブラリをインポート（配列操作用）


def findColor(
    img,
    color,
    options={"region": None},  # 検索範囲を指定するオプション
):
    """指定された色を画像内で検索し、見つかった場合は座標を返す関数

    Args:
        img {Image}: 検索対象の画像
        color {number | string}: 検索するRGB色。整数の場合は0xRRGGBB形式、文字列の場合は"#RRGGBB"形式。
        options {dict}: 検索オプション。regionキーで検索範囲を指定可能。

    Returns:
        tuple: 見つかった色の座標 (x, y) または False
    """
    # 1. 検索範囲 (region) を設定
    if options["region"]:  # オプションでregionが指定されている場合
        [region_x, region_y, region_width, region_height] = options["region"]
    else:  # 指定がない場合は画像全体を範囲とする
        region_x = 0
        region_y = 0
        region_height, region_width = img.shape[:2]
    # 2. 色を探す
    for y in range(region_y, region_y + region_height):  # 指定範囲内のy座標をループ
        for x in range(region_x, region_x + region_width):  # 指定範囲内のx座標をループ
            if (np.flip(img[y][x]) == np.array(color)).all():  # 色が一致するピクセルを検索
                return (x, y)  # 見つかった座標を返す
    return False  # 見つからない場合はFalseを返す


def findColorInRegion(img, color, x=None, y=None, width=None, height=None):
    """指定された領域内で色を検索する関数"""
    img_height, img_width = img.shape[:2]  # 画像全体の高さと幅を取得
    if x is None:  # xが指定されていない場合は0に設定
        x = 0
    if y is None:  # yが指定されていない場合は0に設定
        y = 0
    if width is None:  # 幅が指定されていない場合は画像全体の幅に設定
        width = img_width
    if height is None:  # 高さが指定されていない場合は画像全体の高さに設定
        height = img_height
    return findColor(  # findColor関数を呼び出して結果を返す
        img,
        color,
        options={"region": [x, y, width, height]},
    )


def findImage(
    img,
    template,
    options={"threshold": 0.9, "region": None},  # 閾値と検索範囲を指定するオプション
):
    """指定された画像テンプレートを検索し、見つかった場合は座標を返す関数

    Args:
        img {Image}: 検索対象の画像
        template {Image}: 検索するテンプレート画像
        options {dict}: 検索オプション。thresholdで画像の一致度を指定可能。

    Returns:
        tuple: 見つかったテンプレートの中心座標 (x, y) または False
    """
    # 1. 検索範囲 (region) を設定
    if options["region"]:  # オプションでregionが指定されている場合
        [region_x, region_y, region_width, region_height] = options["region"]
    else:  # 指定がない場合は画像全体を範囲とする
        region_x = 0
        region_y = 0
        region_height, region_width = img.shape[:2]
    regionImg = img[  # 検索範囲を切り抜き
        region_y : region_y + region_height, region_x : region_x + region_width
    ]
    # 2. テンプレートマッチングを実行
    res = cv2.matchTemplate(regionImg, template, cv2.TM_CCOEFF_NORMED)
    # 3. 結果から最小値・最大値とその位置を取得
    minVal, maxVal, minLoc, maxLoc = cv2.minMaxLoc(res)
    confidence = maxVal  # 最大一致度を取得
    if confidence <= options["threshold"]:  # 閾値以下の場合はFalseを返す
        return False
    else:
        # 5. 見つかったテンプレートの中心座標を計算
        deltaX, deltaY = maxLoc  # テンプレートの一致位置
        templ_height, templ_width = template.shape[:2]  # テンプレートのサイズを取得
        pos = (
            deltaX + region_x + int(templ_width / 2),  # テンプレートの中心x座標
            deltaY + region_y + int(templ_height / 2),  # テンプレートの中心y座標
        )
        return pos  # 見つかった座標を返す


def findImageInRegion(
    img, template, x=None, y=None, width=None, height=None, threshold=0.9
):
    """指定された領域内でテンプレート画像を検索する関数"""
    img_height, img_width = img.shape[:2]  # 画像全体の高さと幅を取得
    if x is None:  # xが指定されていない場合は0に設定
        x = 0
    if y is None:  # yが指定されていない場合は0に設定
        y = 0
    if width is None:  # 幅が指定されていない場合は画像全体の幅に設定
        width = img_width
    if height is None:  # 高さが指定されていない場合は画像全体の高さに設定
        height = img_height
    return findImage(  # findImage関数を呼び出して結果を返す
        img,
        template,
        options={"threshold": threshold, "region": [x, y, width, height]},
    )
