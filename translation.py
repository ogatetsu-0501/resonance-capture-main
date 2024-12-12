import pandas as pd
import json

# ファイルパス
json_file = "HomeGoodsQuotationFactory.json"
schema_file = "IDschema_updated.csv"  # 提供されたスキーマCSVファイル
output_file = "HomeGoodsQuotationFactory_translated.json"
untranslated_file = "untranslated_parts.json"

# JSONデータの読み込み
with open(json_file, "r", encoding="utf-8") as file:
    json_data = json.load(file)

# スキーマデータの読み込み
schema_df = pd.read_csv(schema_file)

# スキーマを辞書形式に変換
schema_dict = schema_df.set_index("Original")["Translated"].to_dict()

# 翻訳結果と未翻訳部分リスト
translated_data = []
untranslated_parts = {}

# JSONデータ処理
for entry in json_data:
    idCN = entry["idCN"]
    parts = idCN.split("/")  # idCNを"/"で分割
    translated_parts = []
    untranslated_entry_parts = []

    for part in parts:
        if part in schema_dict:
            translated_parts.append(schema_dict[part])
        else:
            translated_parts.append(part)
            untranslated_entry_parts.append(part)  # 未翻訳部分を記録

    # 翻訳結果を構築
    translated_idCN = "/".join(translated_parts)
    translated_entry = entry.copy()
    translated_entry["idCN"] = translated_idCN
    translated_data.append(translated_entry)

    # 未翻訳部分を辞書に記録
    if untranslated_entry_parts:
        untranslated_parts[idCN] = untranslated_entry_parts

# 結果を新しいJSONファイルに保存
with open(output_file, "w", encoding="utf-8") as file:
    json.dump(translated_data, file, ensure_ascii=False, indent=4)

# 未翻訳部分をJSONファイルに保存
with open(untranslated_file, "w", encoding="utf-8") as file:
    json.dump(untranslated_parts, file, ensure_ascii=False, indent=4)

print(f"翻訳処理が完了しました。翻訳済みデータは {output_file} に保存されました。")
print(f"翻訳できなかった部分は {untranslated_file} に保存されました。")
