from app.main import app

def list_routes():
    print("--- REGISTERED ROUTES ---")
    for route in app.routes:
        if hasattr(route, "path"):
            methods = getattr(route, "methods", [])
            print(f"{list(methods)} {route.path}")
    print("-------------------------")

if __name__ == "__main__":
    list_routes()
