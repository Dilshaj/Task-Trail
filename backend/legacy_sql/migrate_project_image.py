"""
Migrate the `projects.image` column from NVARCHAR(MAX) (base64) to VARCHAR(500) (Cloudinary URL).
Also clears any existing base64 data in the column (replaces with NULL).
"""
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

    # 1. Null out any base64 data (data:image/...)
    cursor.execute("""
        UPDATE projects
        SET image = NULL
        WHERE image IS NOT NULL AND image LIKE 'data:image%'
    """)
    rows_cleared = cursor.rowcount
    conn.commit()
    print(f"Cleared {rows_cleared} base64 images from projects table.")

    # 2. Alter column to VARCHAR(500)
    cursor.execute("ALTER TABLE projects ALTER COLUMN image VARCHAR(500)")
    conn.commit()
    print("Column 'image' changed to VARCHAR(500) successfully!")

    conn.close()
except Exception as e:
    print(f"Error: {e}")
