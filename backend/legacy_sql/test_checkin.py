import requests
url = 'http://localhost:5000/api/attendance/check-in'
# Murali EID: 2026992
data = {
    "employee_id": "2026992",
    "latitude": 17.3850,
    "longitude": 78.4867,
    "location_name": "Hyderabad, Dilshaj Infotech"
}
try:
    print(f"Checking in {data['employee_id']}...")
    res = requests.post(url, json=data)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")
except Exception as e:
    print(f"Error: {e}")
