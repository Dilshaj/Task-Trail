import pyodbc
from datetime import datetime
import uuid

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
    
    emp_img = cursor.execute("SELECT name FROM employees_table WHERE employee_id='2026999'").fetchone()
    name = emp_img[0] if emp_img else "Developer"
    
    # insert an offer letter
    offer_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO offer_letters (id, employee_id, name, role, joining_date, location, package, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (offer_id, '2026999', name, 'Software Engineer', 'October 2026', 'Remote', '10.0 LPA', now))
    
    conn.commit()
    print("Offer letter created successfully for 2026999!")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
