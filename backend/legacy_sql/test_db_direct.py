import pyodbc
try:
    conn_str = (
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=database-1.cjky0ymqumm0.ap-south-2.rds.amazonaws.com,1433;"
        "DATABASE=Database1;"
        "UID=admin;"
        "PWD=Dilshaj786;"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
    )
    conn = pyodbc.connect(conn_str)
    print("✅ Connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
