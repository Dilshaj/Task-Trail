import requests

try:
    res = requests.post("http://127.0.0.1:8000/api/auth/login", json={
        "email": "dilshajceo@dilshajinfotech.tech",
        "password": "admin@123"
    })
    print(res.status_code, res.text)
except Exception as e:
    import traceback
    traceback.print_exc()
