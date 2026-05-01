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
    cursor.execute("SELECT id, name, employee_id, email, user_role FROM employees_table WHERE email = 'dilshajceo@dilshajinfotech.tech'")
    admin = cursor.fetchone()
    print(f"Admin Employee ID: {admin[2]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
