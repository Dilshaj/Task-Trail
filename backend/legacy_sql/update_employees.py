import pyodbc
from passlib.hash import bcrypt

password_hash = bcrypt.hash("admin@123")

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
    
    # Check 'employees_table' columns
    cursor.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'employees_table'")
    columns = [row[0] for row in cursor.fetchall()]
    print(f"Employees Table Columns: {columns}")
    
    # Try updating it for any row with email starting with 'dilshaj'
    cursor.execute("UPDATE employees_table SET password_hash = ? WHERE email LIKE 'dilshaj%'", (password_hash,))
    print(f"Rows affected in employees_table: {cursor.rowcount}")
    
    conn.commit()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
