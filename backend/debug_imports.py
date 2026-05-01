import sys
import os

# Add the current directory to sys.path to ensure absolute imports work
sys.path.append(os.getcwd())

try:
    print("Testing app.schemas.schemas...")
    from app.schemas import schemas
    print("✅ schemas imported successfully.")
except Exception as e:
    print(f"❌ schemas FAILED: {e}")
    import traceback
    traceback.print_exc()

try:
    print("\nTesting app.routes.pay_slips...")
    from app.routes import pay_slips
    print("✅ pay_slips imported successfully.")
except Exception as e:
    print(f"❌ pay_slips FAILED: {e}")
    import traceback
    traceback.print_exc()

try:
    print("\nTesting app.main...")
    from app.main import app
    print("✅ main imported successfully.")
except Exception as e:
    print(f"❌ main FAILED: {e}")
    import traceback
    traceback.print_exc()
