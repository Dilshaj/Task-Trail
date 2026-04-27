import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

# RDS Connection String
conn_str = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={os.getenv('DB_HOST')};"
    f"DATABASE={os.getenv('DB_NAME')};"
    f"UID={os.getenv('DB_USER')};"
    f"PWD={os.getenv('DB_PASSWORD')};"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)

def fix_schema():
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        print("Starting RDS Schema Repair...")

        # List of columns to check and add to users_table
        columns_to_add = [
            ("project_id", "NVARCHAR(50) NULL"),
            ("employee_id", "NVARCHAR(50) NULL"),
            ("is_first_login", "BIT DEFAULT 1"),
            ("user_role", "NVARCHAR(20) DEFAULT 'user'"),
            ("avatar_url", "NVARCHAR(500) NULL"),
            ("joining_date", "NVARCHAR(50) NULL"),
            ("daily_progress", "FLOAT DEFAULT 0.0"),
            ("weekly_progress", "FLOAT DEFAULT 0.0"),
            ("updated_at", "DATETIME DEFAULT GETDATE()")
        ]

        for col_name, col_type in columns_to_add:
            try:
                # Check if column exists
                check_sql = f"SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users_table') AND name = '{col_name}'"
                cursor.execute(check_sql)
                if not cursor.fetchone():
                    print(f"Adding missing column: {col_name}...")
                    cursor.execute(f"ALTER TABLE users_table ADD {col_name} {col_type}")
                    conn.commit()
                else:
                    print(f"Column already exists: {col_name}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")

        # Migration: Copy role_id to user_role if user_role is current default 'user'
        try:
            print("Syncing legacy role_id to user_role...")
            cursor.execute("UPDATE users_table SET user_role = role_id WHERE user_role = 'user' AND role_id IS NOT NULL")
            conn.commit()
            print("Sync complete.")
        except Exception as e:
            print(f"Sync failed (maybe role_id missing?): {e}")

        print("\nRDS Schema Repair Complete! Restart your backend services now.")
        conn.close()
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    fix_schema()
