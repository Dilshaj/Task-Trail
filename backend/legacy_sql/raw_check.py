import pyodbc
conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=database-1.cjky0ymqumm0.ap-south-2.rds.amazonaws.com,1433;"
    "DATABASE=Database1;"
    "UID=admin;"
    "PWD=Dilshaj786;"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
)
try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    
    # Try to find users table
    cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables: {tables}")
    
    if 'users' in tables:
        cursor.execute("SELECT id, name, email, role FROM users")
        for row in cursor.fetchall():
            print(f"User: {row}")
    else:
        print("'users' table not found.")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
