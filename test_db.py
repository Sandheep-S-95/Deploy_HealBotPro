from sqlmodel import Session, create_engine
from db import User
from passlib.context import CryptContext

DATABASE_URL = "sqlite:///./healbot.db"
engine = create_engine(DATABASE_URL, echo=True)

def test_db_insert():
    try:
        with Session(engine) as session:
            new_user = User(
                username="test_direct_insert_" + str(hash("user")),
                hashed_password="plain_test_password",
                full_name="Direct Insert Test"
            )
            print(f"Creating user: {new_user}")
            session.add(new_user)
            print("Committing...")
            session.commit()
            print("Refreshing...")
            session.refresh(new_user)
            print(f"Success: {new_user}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_db_insert()
