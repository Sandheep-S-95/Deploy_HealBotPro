import os
import json
import PyPDF2
import datetime
import uuid
from groq import Groq
from neo4j import GraphDatabase
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

# ==========================================
# 1. CONFIGURATION & API KEYS
# ==========================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
NEO4J_URI = os.getenv("NEO4J_URI", "")
NEO4J_USER = os.getenv("NEO4J_USER", "")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")

# Initialize Clients
groq_client = Groq(api_key=GROQ_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)
pinecone_index = pc.Index("medical-disease-rag")
neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================

def read_medical_document(file_path):
    """Reads a PDF medical history document."""
    if not file_path or not os.path.exists(file_path):
        return None
    
    print(f"📄 Reading medical document: {file_path}")
    text = ""
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading document: {e}")
        return None

def extract_symptoms_with_llm(user_input, medical_history_text=None):
    """Uses Groq to extract a clean Python list of symptoms from the user's input."""
    print("🧠 [Groq] Extracting symptoms from user input...")
    
    system_prompt = (
        "You are a medical extraction assistant. Extract current symptoms from the user's input. "
        "Return ONLY a raw JSON list of strings, all lowercase. No markdown, no explanations. "
        "Example: [\"headache\", \"fever\", \"nausea\"]"
    )
    
    prompt = f"User Input: {user_input}\n"
    if medical_history_text:
        prompt += f"Note: User also provided medical history, but focus on extracting the CURRENT symptoms they are experiencing from the input, while keeping history in mind: {medical_history_text[:1000]}"

    response = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        model="llama-3.1-8b-instant", # Fast, efficient model for extraction
        temperature=0.1
    )
    
    try:
        # Clean and parse the JSON list
        symptoms = json.loads(response.choices[0].message.content.strip())
        print(f"   -> Extracted Symptoms: {symptoms}")
        return symptoms
    except:
        print("   -> Failed to parse symptoms. Defaulting to manual split.")
        return user_input.lower().split(",")

def pass_1_neo4j_graph_search(symptoms):
    """Queries Neo4j to find diseases that share the extracted symptoms."""
    print("🕸️  [Pass 1: Neo4j] Traversing Graph Database...")
    diseases = []
    
    query = """
    MATCH (s:Symptom)-[:INDICATES]->(d:Disease)
    WHERE s.name IN $symptoms
    RETURN d.name AS disease, collect(s.name) AS matched_symptoms, count(s) AS match_count
    ORDER BY match_count DESC
    LIMIT 3
    """
    
    with neo4j_driver.session() as session:
        result = session.run(query, symptoms=symptoms)
        for record in result:
            diseases.append(record["disease"])
            print(f"   -> Found potential link: {record['disease']} (Matched: {record['matched_symptoms']})")
            
    return diseases

def pass_2_pinecone_rag_retrieval(symptoms, target_diseases, user_id=None):
    """Fetches detailed medical context for identified diseases and also pulls patient history."""
    print("🌲 [Pass 2: Pinecone] Retrieving detailed medical context and history...")
    
    query_text = " ".join(symptoms)
    vector = embedding_model.encode(query_text).tolist()

    # 1. Retrieve Clinical Disease Context (General Knowledge)
    clinical_context = ""
    if target_diseases:
        response_disease = pinecone_index.query(
            vector=vector,
            filter={"disease_name": {"$in": target_diseases}},
            top_k=5, 
            include_metadata=True
        )
        for match in response_disease['matches']:
            clinical_context += f"--- Clinical Info: {match['metadata']['disease_name']} ---\n"
            clinical_context += f"{match['metadata']['text']}\n\n"
    
    # 2. Retrieve Patient History (Personal Context)
    patient_history_context = ""
    if user_id:
        print(f"   -> Fetching history for user: {user_id}")
        response_history = pinecone_index.query(
            vector=vector,
            filter={"user_id": {"$eq": user_id}},
            top_k=3,
            include_metadata=True
        )
        for match in response_history['matches']:
            patient_history_context += f"--- Past History ({match['metadata'].get('date', 'Unknown Date')}): ---\n"
            patient_history_context += f"{match['metadata']['text']}\n\n"

    return clinical_context, patient_history_context

def generate_consultation_report(user_input, symptoms, target_diseases, medical_context, patient_history_context=None, medical_history_doc_text=None):
    """Uses Groq to generate the final Doctor's Consultation Report."""
    print("✍️  [Groq] Generating final Doctor's Consultation Report...\n")
    
    system_prompt = (
        "You are an AI medical assistant preparing a consultation brief for a Doctor. "
        "Synthesize the patient's input, their extracted symptoms, their medical history (from database and provided documents), "
        "and the retrieved medical database context into a highly professional, clinical report. "
        "Highlight correlations between their past history and current complaint. "
        "Include a disclaimer that this is an AI-generated brief to assist the physician, not a final diagnosis. "
        "IMPORTANT: Do not use markdown formatting like asterisks (*) for bold or bullet points. Use plain text and simple numbering if needed."
    )
    
    user_prompt = f"""
    Patient Current Complaint: {user_input}
    Extracted Symptoms: {symptoms}
    
    Provided Medical History (Document): 
    {medical_history_doc_text if medical_history_doc_text else "None provided."}
    
    --- Database & Historical Findings ---
    - Possible Conditions Identified by Graph: {target_diseases}
    
    - Clinical Knowledge Base (Context):
    {medical_context}
    
    - Patient's Known Medical History (from database):
    {patient_history_context if patient_history_context else "No historical records found for this user."}
    
    Please output a structured Doctor's Consultation Report including: 
    1. Patient Summary 
    2. Symptom Analysis 
    3. Graph Database Findings 
    4. Relevant Contextual Notes (from medical database)
    
    REMEMBER: No asterisks (*) in the output.
    """

    response = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model="llama-3.3-70b-versatile", # Powerful model for complex reasoning and formatting
        temperature=0.3
    )
    
    # Post-process to remove any incidental asterisks
    report_content = response.choices[0].message.content
    return report_content.replace("*", "")


# ==========================================
# 3. MAIN APPLICATION PIPELINE
# ==========================================

def run_consultation(user_text, user_id=None, doc_path=None):
    print("="*50)
    print("🏥 STARTING AI CONSULTATION PIPELINE")
    print("="*50)
    
    # Step 0: Read Document (Scenario 2)
    history_doc_text = read_medical_document(doc_path)
    
    # Step 1: Extract Symptoms (Groq)
    symptoms = extract_symptoms_with_llm(user_text, history_doc_text)
    
    # Step 2: Graph Traversal (Neo4j)
    diseases = pass_1_neo4j_graph_search(symptoms)
    
    # Step 3: Vector Retrieval (Pinecone - Hybrid Search)
    clinical_context, patient_history_context = pass_2_pinecone_rag_retrieval(symptoms, diseases, user_id)
    
    # Step 4: Final Report Generation (Groq)
    report = generate_consultation_report(user_text, symptoms, diseases, clinical_context, patient_history_context, history_doc_text)
    
    print("="*50)
    print("🩺 FINAL CONSULTATION REPORT")
    print("="*50)
    print(report)


def upload_user_history(user_id, text):
    """Vectorizes and uploads a user's medical history to Pinecone."""
    print(f"🌲 [Pinecone] Encoding history for user: {user_id}...")
    
    # 1. Generate embedding
    embedding = embedding_model.encode(text).tolist()
    
    # 2. Prepare metadata
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    vector_id = f"user_{user_id}_hist_{uuid.uuid4().hex[:8]}"
    
    vector = {
        "id": vector_id,
        "values": embedding,
        "metadata": {
            "user_id": user_id,
            "text": text,
            "type": "medical_history",
            "date": timestamp
        }
    }
    
    # 3. Upsert to Pinecone
    try:
        pinecone_index.upsert(vectors=[vector])
        print(f"   ✅ History successfully encoded with ID: {vector_id}")
        return True
    except Exception as e:
        print(f"   ❌ Failed to upload history: {e}")
        return False


def check_user_history_exists(user_id):
    """
    Checks if any medical history for the user exists in Pinecone
    via a low-latency metadata query.
    """
    if not user_id or user_id == "guest":
        return False
        
    try:
        # Dummy vector for query (DIM=384)
        dummy_vector = [0.0] * 384 
        query_response = pinecone_index.query(
            vector=dummy_vector,
            filter={"user_id": {"$eq": user_id}},
            top_k=1,
            include_metadata=False
        )
        return len(query_response['matches']) > 0
    except Exception as e:
        print(f"🌲 [Pinecone] Status check error: {e}")
        return False


# ==========================================
# RUN THE SCENARIOS
# ==========================================
if __name__ == "__main__":
    
    # --- SCENARIO 1: Symptoms Only ---
    print("\n\n>>> RUNNING SCENARIO 1 (No Document) <<<")
    patient_input_1 = "I have been experiencing a terrible headache for the last two days, along with some nausea and intense sweating."
    run_consultation(user_text=patient_input_1, doc_path=None)
    
    
    # --- SCENARIO 2: Symptoms + Medical History Document ---
    print("\n\n>>> RUNNING SCENARIO 2 (With Document) <<<")
    patient_input_2 = "I have severe abdominal pain and vomiting. It feels worse than last time."
    
    # To test this, you can create a dummy PDF named 'patient_history.pdf' in the same folder, 
    # or just create a text file and modify `read_medical_document` to read `.txt`.
    # I am putting a placeholder path here.
    dummy_doc_path = "patient_history.pdf" 
    
    # run_consultation(user_text=patient_input_2, doc_path=dummy_doc_path)