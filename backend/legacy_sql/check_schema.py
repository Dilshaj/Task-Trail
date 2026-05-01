import os, pyodbc, logging
from dotenv import load_dotenv

load_dotenv()

def check_table():
    server = os.getenv("DB_HOST")
    database = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    
    drivers = ['ODBC Driver 18 for SQL Server', 'ODBC Driver 17 for SQL Server', 'SQL Server']
    conn = None
    for drv in drivers:
        try:
            conn_str = f'DRIVER={{{drv}}};SERVER={server};DATABASE={database};UID={user};PWD={password};Encrypt=yes;TrustServerCertificate=yes'
            conn = pyodbc.connect(conn_str, timeout=5)
            print(f"Connected with {drv}")
            break
        except: continue
        
    if not conn:
        print("Failed to connect.")
        return
        
    cursor = conn.cursor()
    print("Listing 'users' table across all schemas:")
    cursor.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'users'")
    for row in cursor.fetchall():
        print(f"- Schema: {row.table_schema}, Table: {row.table_name}")
        
    print("\nColumns in 'users' table:")
    try:
        for row in cursor.columns(table='users'):
            print(f"- {row.column_name}")
    except Exception as e:
        print(f"Error: {e}")
    conn.close()

if __name__ == "__main__":
    check_table()
