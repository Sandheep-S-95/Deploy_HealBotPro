import sqlite3

def check_schema():
    conn = sqlite3.connect('healbot.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(user)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"ColID: {col[0]}, Name: {col[1]}, Type: {col[2]}, NotNull: {col[3]}, Default: {col[4]}, PK: {col[5]}")
    conn.close()

if __name__ == "__main__":
    check_schema()
