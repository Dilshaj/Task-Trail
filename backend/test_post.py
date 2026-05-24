import requests

def test_login():
    url = "http://localhost:5000/api/auth/login"
    
    # Test case 1: Management admin login (Email + Password)
    payload1 = {
        "email": "dilshajceo@dilshajinfotech.tech",
        "password": "admin@123"
    }
    print("Sending management login request...")
    res = requests.post(url, json=payload1)
    print(f"Status: {res.status_code}")
    try:
        print(f"Response: {res.json()}")
    except:
        print(f"Response (text): {res.text}")

    # Test case 2: Team Lead login (Employee ID + Password)
    payload2 = {
        "employee_id": "TL-001",
        "password": "admin" # Let's see what happens
    }
    print("\nSending team lead login request...")
    res = requests.post(url, json=payload2)
    print(f"Status: {res.status_code}")
    try:
        print(f"Response: {res.json()}")
    except:
        print(f"Response (text): {res.text}")

if __name__ == "__main__":
    test_login()
