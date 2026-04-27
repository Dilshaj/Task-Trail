import pyodbc
import os
from dotenv import load_dotenv

load_dotenv()

conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=database-1.cjky0ymqumm0.ap-south-2.rds.amazonaws.com,1433;"
    "DATABASE=Database1;"
    "UID=admin;"
    "PWD=Dilshaj786;"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)

def check():
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sys.tables WHERE name = 'employees_table'")
        print(f"employees_table exists: {cursor.fetchone()}")
        
        if True:
            cursor.execute("SELECT COUNT(*) FROM employees_table")
            print(f"employees_table count: {cursor.fetchone()[0]}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
