import requests
import time

url = 'http://localhost:5000/api/auth/login'
data = {
    "email": "dilshajceo@dilshajinfotech.tech",
    "password": "admin@123"
}
start = time.time()
try:
    print(f"Calling {url}...")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
print(f"Time taken: {time.time() - start:.2f}s")
