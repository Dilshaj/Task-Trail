import requests
url = 'http://localhost:5000/api/tasks/'
# Murali: 411a5c88-b78e-4867-8e5f-f0169d920f5e
# EduProva Project: 945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e
data = {
    "title": "Murali Task 1",
    "description": "Verification task",
    "deadline": "2026-03-31",
    "priority": "High",
    "timeline": "daily",
    "assignedTo": "411a5c88-b78e-4867-8e5f-f0169d920f5e",
    "projectId": "945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e"
}
res = requests.post(url, json=data)
print(f"Post Status: {res.status_code}")
print(f"Post Response: {res.json()}")

res_tasks = requests.get(url).json()
print(f"All Tasks count: {len(res_tasks)}")
if len(res_tasks) > 0:
    print(f"First task keys: {res_tasks[0].keys()}")
    print(f"First task assignedTo: {res_tasks[0].get('assignedTo')}")
