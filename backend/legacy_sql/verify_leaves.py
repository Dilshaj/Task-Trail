import requests
url = 'http://localhost:5000/api/employee/all-leaves'
try:
    res = requests.get(url)
    print(f"Status: {res.status_code}")
    data = res.json()
    for l in data:
        print(f"User: {l.get('userName')}, Type: {l.get('type')}, Reason: {l.get('reason')}")
except Exception as e:
    print(f"Error: {e}")
