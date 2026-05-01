import requests
url = 'http://localhost:5000/api/attendance/?project_id=945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e'
try:
    res = requests.get(url)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
