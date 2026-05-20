import pandas as pd
import re
import os
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# Helper to load .env manually if it exists
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    val = val.strip().strip("'\"")
                    os.environ[key.strip()] = val

load_env()

# --- Configuration ---
# SECURITY NOTE: Never share your real API key publicly. 
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
INDEX_NAME = "medical-disease-rag"
DATASET_FILE = "local_medical_terms.csv"
PROGRESS_FILE = "pinecone_progress.txt"
BATCH_SIZE = 100 
MAX_CHARS_PER_CHUNK = 8000  # Well under the 40KB limit

# 1. Initialize Pinecone
print("Connecting to Pinecone...")
pc = Pinecone(api_key=PINECONE_API_KEY)

print("Loading Embedding Model...")
# 'all-MiniLM-L6-v2' creates 384-dimensional vectors
model = SentenceTransformer('all-MiniLM-L6-v2')
EMBEDDING_DIMENSION = 384 

# 2. Create the Pinecone Index (if it doesn't exist)
if INDEX_NAME not in pc.list_indexes().names():
    print(f"Creating new Pinecone index: '{INDEX_NAME}'...")
    pc.create_index(
        name=INDEX_NAME,
        dimension=EMBEDDING_DIMENSION,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
index = pc.Index(INDEX_NAME)

# 3. Helper Function to Chunk Text
def chunk_text(text, max_chars):
    """Splits large text into smaller chunks by word to avoid Pinecone metadata limits."""
    words = str(text).split(' ')
    chunks = []
    current_chunk = []
    current_length = 0
    
    for word in words:
        # +1 accounts for the space character
        if current_length + len(word) + 1 > max_chars:
            chunks.append(' '.join(current_chunk))
            current_chunk = [word]
            current_length = len(word)
        else:
            current_chunk.append(word)
            current_length += len(word) + 1
            
    if current_chunk:
        chunks.append(' '.join(current_chunk))
        
    return chunks

# 4. Load Dataset
print(f"Loading dataset from {DATASET_FILE}...")
df = pd.read_csv(DATASET_FILE)
disease_pattern = re.compile(r"What is (.*?) and explain in detail\?")

# 5. Check for existing progress (Resumption Logic)
start_idx = 0
if os.path.exists(PROGRESS_FILE):
    with open(PROGRESS_FILE, "r") as f:
        content = f.read().strip()
        if content.isdigit():
            start_idx = int(content)
            print(f"Resuming upload from row index: {start_idx}")

# 6. Process and Upload
print("Generating embeddings and uploading to Pinecone...")
vectors_to_upload = []

# Use .iloc[start_idx:] to skip rows that were already successfully uploaded
for i, row in tqdm(df.iloc[start_idx:].iterrows(), total=len(df)-start_idx):
    full_text = str(row['text'])
    
    match = disease_pattern.search(full_text)
    disease_name = match.group(1).strip() if match else f"Unknown_Disease_{i}"
        
    # Split the massive text into safe-sized chunks
    text_chunks = chunk_text(full_text, MAX_CHARS_PER_CHUNK)
    
    for chunk_idx, chunk_content in enumerate(text_chunks):
        embedding = model.encode(chunk_content).tolist()
        
        # Create a unique ID for every chunk (e.g., disease_5_chunk_0)
        vector_id = f"disease_{i}_chunk_{chunk_idx}"
        vector_data = {
            "id": vector_id,
            "values": embedding,
            "metadata": {
                "disease_name": disease_name,
                "chunk_index": chunk_idx,
                "text": chunk_content 
            }
        }
        vectors_to_upload.append(vector_data)
        
        # Upload batch and save progress
        if len(vectors_to_upload) >= BATCH_SIZE:
            index.upsert(vectors=vectors_to_upload)
            vectors_to_upload = []
            
            # Record the index of the next row to process
            with open(PROGRESS_FILE, "w") as f:
                f.write(str(i + 1))

# Upload any remaining vectors in the final partial batch
if vectors_to_upload:
    index.upsert(vectors=vectors_to_upload)
    with open(PROGRESS_FILE, "w") as f:
        f.write(str(len(df)))

# Clean up the progress file once the entire dataset is finished
if os.path.exists(PROGRESS_FILE):
    os.remove(PROGRESS_FILE)

print("\nUpload Complete! Database successfully chunked and populated.")