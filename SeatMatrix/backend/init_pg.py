import os
import sys

# Ensure the app can be imported
sys.path.append(os.path.dirname(__file__))

from app import init_db

print("Starting Database Initialization on Supabase...")
init_db()
print("--- SUCCESS: Database Tables Created! ---")
