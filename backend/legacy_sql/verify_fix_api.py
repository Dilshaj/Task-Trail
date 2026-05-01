import requests
import json

BASE_URL = "http://localhost:5000/api"

def verify():
    # 1. Login
    login_data = {
        "email": "dilshajceo@dilshajinfotech.tech",
        "password": "admin@123"
    }
    print("Attempting login...")
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"Login failed: {response.status_code} - {response.text}")
        return
    
    token = response.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Get Employees (This was the failing query)
    print("\nFetching employees (testing project_id query)...")
    emp_response = requests.get(f"{BASE_URL}/employees", headers=headers)
    
    if emp_response.status_code == 200:
        print("Successfully fetched employees!")
        print(f"Employee count: {len(emp_response.json())}")
    else:
        print(f"Failed to fetch employees: {emp_response.status_code}")
        print(f"Error detail: {emp_response.text}")

    # 3. Get Dashboard Metrics (Also involves multiple tables)
    print("\nFetching dashboard metrics...")
    metrics_response = requests.get(f"{BASE_URL}/dashboard/admin", headers=headers)
    if metrics_response.status_code == 200:
        print("Successfully fetched dashboard metrics!")
        print(json.dumps(metrics_response.json(), indent=2))
    else:
        print(f"Failed to fetch metrics: {metrics_response.status_code}")
        print(metrics_response.text)

if __name__ == "__main__":
    verify()
