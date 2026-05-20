from neo4j import GraphDatabase
import os
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

# --- 2. NEO4J CONNECTION ---
# Changed +s to +ssc to bypass local SSL certificate verification issues in VS Code
NEO4J_URI = os.getenv("NEO4J_URI", "")
NEO4J_USER = os.getenv("NEO4J_USER", "")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

# The file we generated in Phase 2
CYPHER_FILE = "master_disease_graph.cypher"

def execute_queries_to_cloud():
    print(f"Connecting to Neo4j AuraDB at {NEO4J_URI}...")
    
    # Initialize the Neo4j Driver
    driver = GraphDatabase.driver(NEO4J_URI,auth=(NEO4J_USER, NEO4J_PASSWORD))

    try:
        # Verify the connection
        driver.verify_connectivity()
        print("Successfully connected to Neo4j AuraDB!")
        
    except Exception as e:
        print(f"Connection failed: {e}")

        # Read and parse the master cypher file
        print(f"Reading '{CYPHER_FILE}'...")
        if not os.path.exists(CYPHER_FILE):
            print(f"Error: Could not find {CYPHER_FILE}. Make sure Phase 2 finished.")
            return

    with open(CYPHER_FILE, "r", encoding="utf-8") as file:
        raw_cypher_text = file.read()

    # Split the massive text block into individual executable statements using the semicolon.
    # This prevents sending a massive payload that would crash the free tier.
    queries = [q.strip() for q in raw_cypher_text.split(';') if q.strip()]
    total_queries = len(queries)
    
    print(f"Found {total_queries} individual queries to execute.")
    print("Beginning cloud upload. This may take a while depending on your internet connection...\n")

    # Execute queries using a database session
    success_count = 0
    with driver.session() as session:
        for idx, query in enumerate(queries, 1):
            try:
                # Run the single statement
                session.run(query)
                success_count += 1
                
                # Print progress every 100 queries to prevent terminal spam
                if idx % 100 == 0 or idx == total_queries:
                    percent = (idx / total_queries) * 100
                    print(f"  -> Uploaded {idx}/{total_queries} queries ({percent:.1f}%)")
                    
            except Exception as e:
                # If one query fails (e.g., syntax error), we print it but keep going
                print(f"\n[!] Error on query {idx}: {query}")
                print(f"    Details: {e}\n")

    # Cleanup
    driver.close()
    print(f"\nUpload Complete! Successfully executed {success_count} out of {total_queries} queries.")

if __name__ == "__main__":
    execute_queries_to_cloud()