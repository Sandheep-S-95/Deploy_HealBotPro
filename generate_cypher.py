import pandas as pd
import re
import os
import glob

# --- Configuration ---
csv_input_dir = "dataset_parts"       # Where the small CSVs live
output_file = "master_disease_graph.cypher" # The SINGLE file where everything goes

# Regex and Symptoms Setup
disease_pattern = re.compile(r"What is (.*?) and explain in detail\?")
common_symptoms = [
    "headache", "nausea", "vomiting", "fatigue", "dizziness", "fever", 
    "abdominal pain", "confusion", "diarrhea", "cough", "shortness of breath",
    "joint pain", "sweating", "anxiety", "insomnia", "weight loss"
]

# 1. Initialize the Master File (Overwrites any old file from previous runs)
with open(output_file, "w", encoding="utf-8") as f:
    f.write("CREATE CONSTRAINT IF NOT EXISTS FOR (d:Disease) REQUIRE d.name IS UNIQUE;\n")
    f.write("CREATE CONSTRAINT IF NOT EXISTS FOR (s:Symptom) REQUIRE s.name IS UNIQUE;\n\n")
print(f"Initialized {output_file} with constraints.")

# 2. Find and properly sort all the split CSV files numerically
csv_files = glob.glob(os.path.join(csv_input_dir, "data_part_*.csv"))
# This ensures it processes 1, 2, 3... instead of alphabetical 1, 10, 11, 2, 3...
csv_files.sort(key=lambda x: int(os.path.basename(x).split('_')[-1].split('.')[0]))

total_files = len(csv_files)
print(f"Found {total_files} CSV parts to process.\n")

for current_idx, csv_file in enumerate(csv_files, 1):
    filename = os.path.basename(csv_file)
    print(f"--- Processing {filename} ({current_idx}/{total_files}) ---")
    
    # Load the small CSV into memory
    df_chunk = pd.read_csv(csv_file)
    total_rows_in_chunk = len(df_chunk)
    cypher_queries = []
    
    for i, row in enumerate(df_chunk.itertuples(), 1):
        text_content = str(getattr(row, 'text', '')).lower()
        original_text = str(getattr(row, 'text', ''))
        
        match = disease_pattern.search(original_text)
        if not match:
            continue
            
        disease_name = match.group(1).strip().lower()
        disease_name = disease_name.replace('"', '\\"')
        
        # Nodes and Relationships
        cypher_queries.append(f'MERGE (d:Disease {{name: "{disease_name}"}});\n')
        
        found_symptoms = [symp for symp in common_symptoms if symp in text_content]
        for symp in found_symptoms:
            cypher_queries.append(f'MERGE (s:Symptom {{name: "{symp}"}});\n')
            cypher_queries.append(
                f'MATCH (d:Disease {{name: "{disease_name}"}}), (s:Symptom {{name: "{symp}"}})\n'
                f'MERGE (s)-[:INDICATES]->(d);\n'
            )
        
        # Terminal Progress Update
        if i % 100 == 0 or i == total_rows_in_chunk:
            percent_done = (i / total_rows_in_chunk) * 100
            print(f"  -> Progress: {percent_done:.1f}% ({i}/{total_rows_in_chunk} rows)")
            
    # 3. APPEND the Cypher queries to the master file
    with open(output_file, "a", encoding="utf-8") as f:
        f.writelines(cypher_queries)
        
    print(f"Successfully appended {len(cypher_queries)} queries to {output_file}.\n")

print(f"Phase 2 Complete: All Cypher queries have been saved into '{output_file}'!")