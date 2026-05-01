import requests
res = requests.get('http://localhost:5000/api/tasks/').json()
for t in res:
    print(f"Task: {t['title']}, AssignedTo: {t['assignedTo']}")
