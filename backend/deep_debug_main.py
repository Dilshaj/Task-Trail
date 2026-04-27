import sys
import os
import traceback

sys.path.append(os.getcwd())

try:
    import app.main
    print("SUCCESS")
except Exception:
    traceback.print_exc()
