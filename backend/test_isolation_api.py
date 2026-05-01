import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_isolation():
    # 1. Get all employees
    print("--- ALL EMPLOYEES ---")
    res = requests.get(f"{BASE_URL}/employees")
    all_emp = res.json()
    for e in all_emp:
        print(f"Name: {e.get('name')}, project_id: {e.get('project_id') or e.get('projectId')}")

    # 2. Get employees for Project A
    proj_a = "69eb4b28df77630ac387939a"
    print(f"\n--- EMPLOYEES FOR PROJECT {proj_a} ---")
    res = requests.get(f"{BASE_URL}/employees", params={"project_id": proj_a})
    proj_a_emp = res.json()
    for e in proj_a_emp:
        print(f"Name: {e.get('name')}, project_id: {e.get('project_id') or e.get('projectId')}")

    # 3. Get employees for Project B
    proj_b = "69f1ee0099d3956e82f1e53c"
    print(f"\n--- EMPLOYEES FOR PROJECT {proj_b} ---")
    res = requests.get(f"{BASE_URL}/employees", params={"project_id": proj_b})
    proj_b_emp = res.json()
    for e in proj_b_emp:
        print(f"Name: {e.get('name')}, project_id: {e.get('project_id') or e.get('projectId')}")

if __name__ == "__main__":
    test_isolation()
