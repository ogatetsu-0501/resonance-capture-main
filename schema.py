import pandas as pd
import json

# ファイルパス
json_file = "HomeGoodsQuotationFactory.json"
csv_file = "IDschema.csv"
output_file = "IDschema_updated.csv"
log_file = "skipped_idCN.log"
conflict_log_file = "conflict_ids.log"

# JSONデータの読み込み
with open(json_file, "r", encoding="utf-8") as file:
    json_data = json.load(file)

# CSVデータの読み込み（1行目をヘッダーとして指定）
df_csv = pd.read_csv(csv_file, header=0)

# すべてのセルを数値型に変換可能な場合は変換
df_csv = df_csv.apply(pd.to_numeric, errors='ignore', downcast='integer')

# 出力用データリスト、スキップリスト、コンフリクトリスト
output_data = []
skipped_idCN = []
conflict_entries = []

# データ処理
pass_counter = 1  # パス用カウンター
for entry in json_data:
    id_value = int(entry["id"])  # JSONのidを整数型として扱う
    idCN_parts = entry["idCN"].split("/")
    
    if len(idCN_parts) != 3:
        # idCNの形式が正しくない場合はスキップ
        skipped_idCN.append(entry["idCN"])
        continue

    city_cn, action_cn, item_cn = idCN_parts
    
    # CSV全体から該当するidを検索
    match = (df_csv == id_value)
    if not match.any().any():
        # 該当するidがCSV内に存在しない場合はスキップ
        skipped_idCN.append(entry["idCN"])
        continue

    # 一致するセルの行番号と列名を取得
    row_idx, col_name = match.stack()[lambda x: x].index[0]
    
    # 商品名と都市名を取得
    item_jp = df_csv.loc[row_idx, "名前"]
    if col_name == "買い":
        buy_or_sell = "買い"
        city_jp = df_csv.loc[row_idx, "駅名"]
    else:
        buy_or_sell = "売り"
        city_jp = col_name

    # 出力データ作成
    new_entries = [
        {"Original": city_cn, "Translated": city_jp, "Match": True, "id": id_value, "idCN": entry["idCN"]},
        {"Original": action_cn, "Translated": buy_or_sell, "Match": True, "id": id_value, "idCN": entry["idCN"]},
        {"Original": item_cn, "Translated": item_jp, "Match": True, "id": id_value, "idCN": entry["idCN"]},
    ]

    # コンフリクトチェック
    for new_entry in new_entries:
        existing = [entry for entry in output_data if entry["Original"] == new_entry["Original"] and entry["Match"]]
        if existing and any(e["Translated"] != new_entry["Translated"] for e in existing):
            for e in existing:
                conflict_entries.append({
                    "Original": new_entry["Original"],
                    "Translated": new_entry["Translated"],
                    "id": new_entry["id"],
                    "idCN": new_entry["idCN"],
                    "Pass": pass_counter,
                    "ConflictWith": e["id"]
                })
                conflict_entries.append({
                    "Original": e["Original"],
                    "Translated": e["Translated"],
                    "id": e["id"],
                    "idCN": e["idCN"],
                    "Pass": pass_counter,
                    "ConflictWith": new_entry["id"]
                })
            pass_counter += 1
        else:
            output_data.append(new_entry)

# 出力データをデータフレームに変換
output_df = pd.DataFrame(output_data)

# 重複データを削除（Original列に基づく）
output_df = output_df.drop_duplicates(subset=["Original"])

# 結果をCSVに保存
output_df.to_csv(output_file, index=False, encoding="utf-8")

# スキップしたidCNをログに出力
with open(log_file, "w", encoding="utf-8") as log:
    for idCN in skipped_idCN:
        log.write(f"{idCN}\n")

# コンフリクトしたデータをログに出力
with open(conflict_log_file, "w", encoding="utf-8") as conflict_log:
    conflict_log.write("Original,Translated,id,idCN,Pass,ConflictWith\n")
    for conflict in conflict_entries:
        conflict_log.write(f"{conflict['Original']},{conflict['Translated']},{conflict['id']},{conflict['idCN']},{conflict['Pass']},{conflict['ConflictWith']}\n")

print(f"処理が完了しました。結果は {output_file} に保存されました。")
print(f"スキップしたidCNは {log_file} に保存されました。")
print(f"コンフリクトしたデータは {conflict_log_file} に保存されました。")
