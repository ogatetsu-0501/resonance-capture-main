import os
import json

# 価格フォルダのパス
base_dir = "価格"

# フォルダ内の町リストを取得
towns = [name for name in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, name))]

# JSONファイルとして保存
with open("towns.json", "w", encoding="utf-8") as f:
    json.dump({"towns": towns}, f, ensure_ascii=False, indent=4)

print("towns.json を生成しました")
