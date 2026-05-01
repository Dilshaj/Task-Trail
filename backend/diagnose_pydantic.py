import sys
import os

sys.path.append(os.getcwd())

try:
    from app.schemas import schemas
    print("app.schemas.schemas imported successfully")
except Exception as e:
    print(f"Error in app.schemas.schemas: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

try:
    from app.routes import auth, employees, projects, tasks, attendance, dashboard, profile, offer_letter, employee_leaves, pay_slips
    print("Routes imported successfully")
except Exception as e:
    print(f"Error in routes: {e}")
    import traceback
    traceback.print_exc()
