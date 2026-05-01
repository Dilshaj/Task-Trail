import os
import glob

search_dir = r"c:\Users\sarip\Downloads\Work-Sheet-main (2)\Work-Sheet-main\backend\app"
for filepath in glob.glob(os.path.join(search_dir, "**/*.py"), recursive=True):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "if not db.db:" in content:
        new_content = content.replace("if not db.db:", "if db.db is None:")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
