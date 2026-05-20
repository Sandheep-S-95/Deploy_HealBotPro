import pandas as pd
import os
import math

# --- Configuration ---
input_file = "local_medical_terms.csv"
csv_output_dir = "dataset_parts"  # Folder to store the smaller CSVs
chunk_size = 500

os.makedirs(csv_output_dir, exist_ok=True)

print("Calculating total dataset size...")
# Fast way to count rows without loading the whole file into memory
total_rows = sum(1 for _ in open(input_file, 'r', encoding='utf-8')) - 1 
total_parts = math.ceil(total_rows / chunk_size)
print(f"Total rows found: {total_rows}. Splitting into {total_parts} parts...\n")

# Process and split
for chunk_idx, chunk in enumerate(pd.read_csv(input_file, chunksize=chunk_size)):
    part_num = chunk_idx + 1
    output_file = os.path.join(csv_output_dir, f"data_part_{part_num}.csv")
    
    if os.path.exists(output_file):
        print(f"[{part_num}/{total_parts}] {output_file} already exists. Skipping...")
        continue
        
    # Save the chunk as a smaller CSV
    chunk.to_csv(output_file, index=False)
    print(f"[{part_num}/{total_parts}] Successfully saved {output_file}")

print("\nPhase 1 Complete: Dataset successfully split into smaller parts!")