import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_attendance():
    print("--- TESTING ATTENDANCE API ---")
    try:
        # 1. Fetch all attendance logs (Global)
        response = requests.get(f"{BASE_URL}/attendance/")
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            logs = response.json()
            print(f"Total Logs Found: {len(logs)}")
            if logs:
                print("Sample Log Sample (Keys):", list(logs[0].keys()))
                print("First Log Details:", {k: logs[0][k] for k in ['id', 'employeeId', 'userName', 'date', 'status']})
            else:
                print("No logs found in backend.")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    test_attendance()
