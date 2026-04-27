import requests
import time

url = 'http://localhost:5000/api/dashboard/admin'
start = time.time()
try:
    print(f"Calling {url}...")
    response = requests.get(url, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
print(f"Time taken: {time.time() - start:.2f}s")
