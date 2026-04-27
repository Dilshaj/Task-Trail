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
    cursor.execute("SELECT id, name, LEFT(CAST(image AS VARCHAR(4000)), 50) as img FROM projects")
    projects = cursor.fetchall()
    print("PROJECTS:")
    for p in projects:
        print(p)
        
    cursor.execute("SELECT id, name, LEFT(CAST(avatar_url AS VARCHAR(4000)), 50) as img FROM employees_table")
    employees = cursor.fetchall()
    print("\nEMPLOYEES:")
    for e in employees:
        print(e)

    conn.close()
except Exception as e:
    print(f"Error: {e}")
