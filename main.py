from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import os
import shutil
import uuid
import datetime
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from sqlmodel import Session, select

# Import local modules
import inference
import db
from db import User, get_session

app = FastAPI(title="HealBot-Pro API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth Configuration ---
# JWT removed for simplicity

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- Pydantic Models ---
class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None

class UserRead(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserRead

class ConsultationRequest(BaseModel):
    user_input: str
    user_id: Optional[str] = None
    doc_path: Optional[str] = None

class ConsultationResponse(BaseModel):
    symptoms: List[str]
    diseases: List[str]
    report: str
    status: str

class HistoryUpdate(BaseModel):
    user_id: str
    text: str

# --- Auth Utilities ---
def verify_password(plain_password, hashed_password):
    return plain_password == hashed_password

def get_password_hash(password):
    return password # No hashing for now

async def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    # Simple auth: the token IS the username
    user = session.exec(select(User).where(User.username == token)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# --- Initialization ---
@app.on_event("startup")
def on_startup():
    db.init_db()

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "HealBot-Pro API is online"}

@app.post("/register", response_model=UserRead)
def register(user_in: UserCreate, session: Session = Depends(get_session)):
    # Check if user exists
    existing_user = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    new_user = User(
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@app.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Simple auth: token is just the username
    access_token = user.username
    
    # Check if user has clinical history in Pinecone
    user_data = user.dict()
    user_data["has_history"] = inference.check_user_history_exists(user.username)
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

@app.get("/users/me", response_model=UserRead)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/consult", response_model=ConsultationResponse)
async def consult(request: ConsultationRequest):
    """Triggers the full AI consultation pipeline."""
    print(f"🏥 API Request: {request.user_input} (User: {request.user_id})")
    try:
        # 1. Pipeline execution
        # We reuse the run_consultation logic from inference.py
        # but we need to capture the intermediate steps for the UI
        
        # Step 0: Read Doc if provided
        history_doc_text = inference.read_medical_document(request.doc_path)
        
        # Step 1: Extraction
        symptoms = inference.extract_symptoms_with_llm(request.user_input, history_doc_text)
        
        # Step 2: Graph
        diseases = inference.pass_1_neo4j_graph_search(symptoms)
        
        # Step 3: RAG
        clinical_context, patient_history_context = inference.pass_2_pinecone_rag_retrieval(
            symptoms, diseases, request.user_id
        )
        
        # Step 4: Final Report
        report = inference.generate_consultation_report(
            request.user_input, symptoms, diseases, 
            clinical_context, patient_history_context, history_doc_text
        )
        
        return {
            "symptoms": symptoms,
            "diseases": diseases,
            "report": report,
            "status": "success"
        }
    except Exception as e:
        print(f"❌ API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Handles medical document upload for Scenario C."""
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(temp_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"file_path": file_path, "filename": file.filename}

@app.get("/user/{user_id}")
async def get_user_status(user_id: str, session: Session = Depends(get_session)):
    """
    Checks if a user has data in the system (Pinecone vectors).
    """
    user = session.exec(select(User).where(User.username == user_id)).first()
    if not user and user_id != "patient_99":
        return {"user_id": user_id, "has_history": False, "status": "New User"}
        
    has_history = inference.check_user_history_exists(user_id)
    return {
        "user_id": user_id,
        "has_history": has_history,
        "status": "Existing User" 
    }

@app.post("/user/history")
async def update_user_history(data: HistoryUpdate):
    """
    Receives clinical details and encodes them into Pinecone 
    for future extensive report generation.
    """
    success = inference.upload_user_history(data.user_id, data.text)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode clinical history")
    return {"status": "success", "message": "Clinical history encoded into vector graph"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
