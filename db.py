from sqlmodel import Field, SQLModel, create_engine, Session, select
from typing import Optional
import os

# --- Configuration ---
DATABASE_URL = "sqlite:///./healbot.db"
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})

# --- Models ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    role: str = Field(default="patient") # patient | doctor | admin

# --- Database Initialization ---
def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
