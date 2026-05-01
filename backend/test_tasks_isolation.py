import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_task_isolation():
    # 1. Get tasks for Project A
    proj_a = "69eb4b28df77630ac387939a"
    print(f"--- TASKS FOR PROJECT {proj_a} ---")
    res = requests.get(f"{BASE_URL}/tasks/project/{proj_a}")
    tasks_a = res.json()
    for t in tasks_a:
        print(f"Task: {t.get('title')}, project_id: {t.get('project_id')}")

    # 2. Get tasks for Project B
    proj_b = "69f1ee0099d3956e82f1e53c"
    print(f"\n--- TASKS FOR PROJECT {proj_b} ---")
    res = requests.get(f"{BASE_URL}/tasks/project/{proj_b}")
    tasks_b = res.json()
    for t in tasks_b:
        print(f"Task: {t.get('title')}, project_id: {t.get('project_id')}")

    # 3. Get all tasks (using a query param if supported, or check what happens if none)
    print("\n--- ALL TASKS (NO PROJECT) ---")
    # Note: The route is /tasks/project/ but the backend service handles empty/null
    res = requests.get(f"{BASE_URL}/tasks/project/") # This might 404 if not trailing slash
    if res.status_code == 200:
        all_tasks = res.json()
        for t in all_tasks:
             print(f"Task: {t.get('title')}, project_id: {t.get('project_id')}")
    else:
        print(f"Status: {res.status_code}")

if __name__ == "__main__":
    test_task_isolation()
