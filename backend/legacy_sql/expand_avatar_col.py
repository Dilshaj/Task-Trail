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
    cursor.execute("ALTER TABLE employees_table ALTER COLUMN avatar_url VARCHAR(500)")
    conn.commit()
    print("avatar_url column expanded to VARCHAR(500) successfully!")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
