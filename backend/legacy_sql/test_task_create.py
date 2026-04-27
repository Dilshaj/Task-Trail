import requests
import time

url = 'http://localhost:5000/api/tasks/'
# Get first available project and employee UUIDs
# From state.json: 
# Project: 945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e (EduProva)
# User (murali): 411a5c88-bad7-4402-8618-912808c32493
data = {
    "title": "Test Task",
    "description": "Auto-assigned by script",
    "deadline": "2026-03-30",
    "priority": "High",
    "timeline": "daily",
    "assignedTo": "411a5c88-bad7-4402-8618-912808c32493",
    "projectId": "945bb6e2-3bd8-4f0c-9e26-d43d89c1b68e"
}
try:
    print(f"Assigning task to {data['assignedTo']}...")
    res = requests.post(url, json=data)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Error: {e}")
