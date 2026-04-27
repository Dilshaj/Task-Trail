from sqlalchemy import text
from app.db.database import engine

def alter_schema():
    with engine.connect() as conn:
        print("Starting Database Schema Update...")
        
        # SQL Server syntax for adding columns
        columns_to_add = [
            ("joining_date", "NVARCHAR(100)"),
            ("location", "NVARCHAR(255)"),
            ("package", "NVARCHAR(100)")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                # Check if column exists first (SQL Server specific)
                check_query = text(f"""
                    IF NOT EXISTS (
                        SELECT * FROM sys.columns 
                        WHERE object_id = OBJECT_ID(N'[dbo].[test_table]') 
                        AND name = N'{col_name}'
                    )
                    BEGIN
                        ALTER TABLE [dbo].[test_table] ADD [{col_name}] {col_type} NULL
                    END
                """)
                conn.execute(check_query)
                conn.commit()
                print(f"Successfully verified/added column: {col_name}")
            except Exception as e:
                print(f"Error processing column {col_name}: {e}")
        
        print("Schema update completed successfully.")

if __name__ == "__main__":
    try:
        alter_schema()
    except Exception as e:
        print(f"Fatal error during migration: {e}")
