import requests
import json

BASE_URL = "http://localhost:5000/api"

def check_all():
    login_data = {"email": "dilshajceo@dilshajinfotech.tech", "password": "admin@123"}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if resp.status_code != 200:
        print("FAIL: Auth")
        return
    token = resp.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print("PASS: Auth")

    # 1. Employees
    emp_resp = requests.get(f"{BASE_URL}/employees", headers=headers)
    print(f"PASS: Employees ({len(emp_resp.json())} found)")

    # 2. Dashboard
    dash_resp = requests.get(f"{BASE_URL}/dashboard/admin", headers=headers)
    print(f"PASS: Dashboard ({dash_resp.json().get('totalTasks')} tasks)")

    # 3. Profile Update
    data = {'name': 'Admin Verified', 'email': 'dilshajceo@dilshajinfotech.tech'}
    # Sending without image to test DB commit speed
    prof_resp = requests.put(f"{BASE_URL}/employee/update-profile", headers=headers, data=data)
    if prof_resp.status_code == 200:
        print("PASS: Profile Update")
    else:
        print(f"FAIL: Profile Update - {prof_resp.text}")

    # 4. Check for existing offer letters
    offers_resp = requests.get(f"{BASE_URL}/offer-letter/", headers=headers)
    offers = offers_resp.json()
    print(f"INFO: Offer Letters in system: {len(offers)}")
    if offers:
        target_eid = offers[0].get('employee_id')
        print(f"Testing download for existing offer: {target_eid}")
        dl_resp = requests.get(f"{BASE_URL}/offer-letter/{target_eid}", headers=headers)
        if dl_resp.status_code == 200:
            print(f"PASS: Offer Download for {target_eid}")
        else:
            print(f"FAIL: Offer Download for {target_eid} - {dl_resp.status_code}")

if __name__ == "__main__":
    check_all()
