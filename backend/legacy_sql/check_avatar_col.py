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
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'employees_table' AND COLUMN_NAME = 'avatar_url'
    """)
    r = cursor.fetchone()
    print(f"avatar_url column: name={r[0]}, type={r[1]}, max_length={r[2]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
