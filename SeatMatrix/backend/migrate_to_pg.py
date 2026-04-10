import sqlite3
import psycopg2
import os
import json
from psycopg2.extras import DictCursor
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())


SQLITE_DB = os.path.join(os.path.dirname(__file__), "..", "database", "seatmatrix.db")
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in .env file!")
        return

    print(f"Connecting to SQLite: {SQLITE_DB}")
    sl_conn = sqlite3.connect(SQLITE_DB)
    sl_cur = sl_conn.cursor()

    print(f"Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(DATABASE_URL)
    pg_cur = pg_conn.cursor()

    tables = [
        "users", "exams", "rooms", "staff", 
        "students", "colleges", "college_halls", "seating"
    ]

    for table in tables:
        print(f"Migrating table: {table}...")
        
        # Get data from SQLite
        sl_cur.execute(f"SELECT * FROM {table}")
        rows = sl_cur.fetchall()
        
        if not rows:
            print(f"  - No data in {table}, skipping.")
            continue

        # Prepare PostgreSQL insert
        # Get column count
        col_count = len(rows[0])
        placeholders = ",".join(["%s"] * col_count)
        
        # Clear existing data in PG to avoid duplicates (Optional, be careful)
        # pg_cur.execute(f"DELETE FROM {table}")
        
        for row in rows:
            try:
                pg_cur.execute(f"INSERT INTO {table} VALUES ({placeholders})", row)
            except Exception as e:
                print(f"  - Error inserting row into {table}: {e}")
                pg_conn.rollback()
                continue
        
        pg_conn.commit()
        print(f"  - Successfully migrated {len(rows)} rows.")

    print("\n--- MIGRATION COMPLETE ---")
    sl_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate()
