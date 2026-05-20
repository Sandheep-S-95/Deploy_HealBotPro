import os
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

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
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
INDEX_NAME = "medical-disease-rag"

# Mock Patient History for Scenario B
MOCK_PATIENT_ID = "patient_99"
MOCK_HISTORY = [
    {
        "text": "Patient has a chronic history of seasonal asthma since childhood. Typically uses an albuterol inhaler. No known allergies to medication.",
        "date": "2023-05-15"
    },
    {
        "text": "Patient reported recurring cluster headaches last year. Was advised to manage stress and monitor sleep patterns. No neurological irregularities found.",
        "date": "2024-11-02"
    },
    {
        "text": "Routine checkup: Blood pressure 125/82. Patient mentioned slight fatigue, likely due to increased workload. Advised Vitamin D supplementation.",
        "date": "2025-01-20"
    }
]

def seed_mock_data():
    print(f"🚀 Seeding mock data for {MOCK_PATIENT_ID}...")
    
    # 1. Initialize Clients
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(INDEX_NAME)
    model = SentenceTransformer('all-MiniLM-L6-v2')

    vectors_to_upload = []
    
    for i, entry in enumerate(MOCK_HISTORY):
        content = entry["text"]
        embedding = model.encode(content).tolist()
        
        vector_id = f"history_{MOCK_PATIENT_ID}_{i}"
        vector_data = {
            "id": vector_id,
            "values": embedding,
            "metadata": {
                "user_id": MOCK_PATIENT_ID,
                "type": "history",
                "date": entry["date"],
                "text": content
            }
        }
        vectors_to_upload.append(vector_data)

    # 2. Upload to Pinecone
    print(f"📦 Uploading {len(vectors_to_upload)} history records...")
    index.upsert(vectors=vectors_to_upload)
    
    print(f"✅ Successfully seeded data for {MOCK_PATIENT_ID} into {INDEX_NAME}.")

if __name__ == "__main__":
    seed_mock_data()
