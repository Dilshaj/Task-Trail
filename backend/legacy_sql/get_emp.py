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
    cursor.execute("SELECT id, name, employee_id, email, user_role FROM employees_table WHERE employee_id='2026999'")
    emp = cursor.fetchone()
    print(f"Employee found: {emp}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
