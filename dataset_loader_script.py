import pandas as pd

# 1. Load the dataset
df = pd.read_json("hf://datasets/aboonaji/wiki_medical_terms_llam2_format/wiki_medical_terms_llam2.jsonl", lines=True)

# 2. Save to a local CSV file
df.to_csv("local_medical_terms.csv", index=False)