import os
from pinecone import Pinecone
from neo4j import GraphDatabase

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

NEO4J_URI = os.getenv("NEO4J_URI", "")
NEO4J_USER = os.getenv("NEO4J_USER", "")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

def smoke_test():
    print("🔍 --- SMOKE TEST: DATABASE READINESS ---")
    
    # 1. Check Pinecone
    print("\n🌲 Checking Pinecone Index Stats...")
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(INDEX_NAME)
        stats = index.describe_index_stats()
        vector_count = stats.get('total_vector_count', 0)
        print(f"   -> Index Name: {INDEX_NAME}")
        print(f"   -> Total Vectors: {vector_count}")
        if vector_count > 0:
            print("   ✅ Pinecone is POPULATED.")
        else:
            print("   ❌ Pinecone is EMPTY.")
    except Exception as e:
        print(f"   ❌ Error connecting to Pinecone: {e}")

    # 2. Check Neo4j
    print("\n🕸️  Checking Neo4j Node/Relationship Counts...")
    try:
        driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        with driver.session() as session:
            # Check Disease nodes
            disease_count = session.run("MATCH (n:Disease) RETURN count(n) AS count").single()["count"]
            # Check Symptom nodes
            symptom_count = session.run("MATCH (n:Symptom) RETURN count(n) AS count").single()["count"]
            # Check Relationships
            rel_count = session.run("MATCH ()-[r:INDICATES]->() RETURN count(r) AS count").single()["count"]
            
            print(f"   -> Disease Nodes: {disease_count}")
            print(f"   -> Symptom Nodes: {symptom_count}")
            print(f"   -> INDICATES Relationships: {rel_count}")
            
            if disease_count > 0 and rel_count > 0:
                print("   ✅ Neo4j is POPULATED.")
            else:
                print("   ❌ Neo4j is EMPTY or incomplete.")
        driver.close()
    except Exception as e:
        print(f"   ❌ Error connecting to Neo4j: {e}")

    print("\n--- SMOKE TEST COMPLETE ---")

if __name__ == "__main__":
    smoke_test()
