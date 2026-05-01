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
    cursor.execute("SELECT employee_id FROM offer_letters")
    letters = cursor.fetchall()
    print(f"Offer letters found for employee IDs: {[row[0] for row in letters]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
