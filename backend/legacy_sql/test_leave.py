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
    cursor.execute("""
    INSERT INTO leave_requests (id, employee_id, leave_type, from_date, to_date, reason, status, created_at) 
    VALUES ('test-123', 'ADMIN-001', 'Sick', '2026-04-10', '2026-04-12', 'Test leave', 'Pending', GETDATE());
    """)
    conn.commit()
    print("Test leave inserted.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
