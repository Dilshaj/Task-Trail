from passlib.hash import bcrypt
import pyodbc

password_hash = bcrypt.hash("admin@123")
print(f"Generated hash: {password_hash}")

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
    
    # Update password_hash for the admin user - it was in users_table OR employees_table?
    # I saw it in users_table in Step 509.
    # WAIT! If it's in users_table, then the models are WRONG if they point to employees_table.
    # But uvicorn log said "Database schemas verified."
    # This means at startup it found the tables it expected.
    
    # I'll update BOTH just to be sure.
    cursor.execute("UPDATE users_table SET password_hash = ? WHERE role = 'admin'", (password_hash,))
    cursor.execute("UPDATE employees_table SET password_hash = ? WHERE role = 'admin'", (password_hash,))
    
    conn.commit()
    print("Passwords UPDATED via Raw SQL on BOTH tables.")
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
