import sys
import os

# Add the current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app.main import app
    print("✅ Successfully imported the FastAPI app!")
    print(f"📋 App title: {app.title}")
    print(f"📋 App version: {app.version}")
    
    # List all routes
    print("\n🔗 Available routes:")
    for route in app.routes:
        if hasattr(route, 'path'):
            methods = ', '.join(route.methods) if hasattr(route, 'methods') else 'N/A'
            print(f"   {methods:20} {route.path}")
                    
except Exception as e:
    print(f"❌ Error importing app: {type(e).__name__}: {e}")
    import traceback
    print("\nStack trace:")
    print(traceback.format_exc())
