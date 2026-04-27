import requests
res = requests.get('http://localhost:5000/api/attendance/').json()
if len(res) > 0:
    for r in res:
        print(f"ID: {r.get('id')}, Date: {r.get('date')}, User: {r.get('userName')}")
else:
    print("EMPTY RESPONSE")
