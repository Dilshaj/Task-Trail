import pyodbc, json
conn_str = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=database-1.cjky0ymqumm0.ap-south-2.rds.amazonaws.com,1433;DATABASE=Database1;UID=admin;PWD=Dilshaj786;Encrypt=yes;TrustServerCertificate=yes;"
conn = pyodbc.connect(conn_str)
cursor = conn.cursor()
cursor.execute("SELECT name, employee_id, avatar_url FROM employees_table")
results = []
for r in cursor.fetchall():
    v = r[2] if r[2] else "NULL"
    results.append((r[0], r[1], v))
conn.close()

print("=== DATABASE: avatar_url per employee ===\n")
for name, eid, avatar in results:
    print(f"Employee: {name} (ID: {eid})")
    if avatar == "NULL":
        print("  -> avatar_url = NULL (no image)")
    elif "cloudinary.com" in avatar:
        print(f"  -> CLOUDINARY URL (CORRECT!): {avatar}")
    elif avatar.startswith("data:image"):
        print(f"  -> BASE64 BLOB IN DB (BAD): {len(avatar)} chars")
    elif avatar.startswith("/static") or avatar.startswith("/uploads"):
        print(f"  -> LOCAL BACKEND PATH (BAD): {avatar}")
    elif avatar.startswith("http"):
        print(f"  -> EXTERNAL URL: {avatar}")
    else:
        print(f"  -> OTHER: {avatar[:120]}")
    print()
