import sys, os
sys.path.append(os.getcwd())
import requests

BASE = "http://127.0.0.1:8000/api"

# 1. Create a test employee
print("=== Creating test employee ===")
r = requests.post(f"{BASE}/employees/", json={
    "employeeId": "EMP999",
    "name": "Test Worker",
    "role": "Tester"
})
print(r.status_code, r.text[:200])

# 2. Try to login with that employee
print("\n=== Logging in as EMP999 with password 'user' ===")
r2 = requests.post(f"{BASE}/auth/login", json={
    "employeeId": "EMP999",
    "password": "user"
})
print(r2.status_code, r2.text[:400])
