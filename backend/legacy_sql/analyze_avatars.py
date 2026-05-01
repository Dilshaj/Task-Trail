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
    cursor.execute("SELECT name, employee_id, avatar_url FROM employees_table")
    rows = cursor.fetchall()
    print("=== EMPLOYEES AVATAR_URL IN DATABASE ===")
    for r in rows:
        name, emp_id, avatar = r[0], r[1], r[2]
        if not avatar:
            status = "NULL (no avatar set)"
        elif avatar.startswith("data:image"):
            status = f"BASE64 BLOB STORED IN DB ({len(avatar)} chars) -- PROBLEM!"
        elif "cloudinary.com" in avatar:
            status = f"CLOUDINARY URL -- CORRECT!"
        elif avatar.startswith("/static") or avatar.startswith("/uploads"):
            status = f"LOCAL BACKEND FILE PATH -- PROBLEM!"
        elif avatar.startswith("http"):
            status = f"EXTERNAL URL"
        else:
            status = f"UNKNOWN: {avatar[:80]}"
        full_val = avatar[:100] if avatar else "None"
        print(f"\n  Name: {name} | ID: {emp_id}")
        print(f"  Status: {status}")
        print(f"  Value: {full_val}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
