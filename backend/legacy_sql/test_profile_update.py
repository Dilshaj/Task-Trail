import requests
import os

BASE_URL = "http://localhost:5000/api"

def test_update():
    # 1. Login to get token
    login_data = {
        "email": "dilshajceo@dilshajinfotech.tech",
        "password": "admin@123"
    }
    print("Logging in...")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if login_resp.status_code != 200:
        print("Login failed")
        return
    token = login_resp.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")

    # 2. Update profile (with valid minimal PNG image)
    import io
    # Minimal 1x1 transparent PNG
    valid_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    dummy_image = io.BytesIO(valid_png)
    files = {'profile_image': ('test.png', dummy_image, 'image/png')}
    data = {
        'name': 'Updated Admin Name',
        'email': 'dilshajceo@dilshajinfotech.tech',
        'joining_date': '2023-01-01'
    }
    
    print("\nAttempting profile update...")
    # NOTE: The route in profile.py is /employee/update-profile
    # Included in main.py with prefix /api
    # So full path is /api/employee/update-profile
    update_resp = requests.put(f"{BASE_URL}/employee/update-profile", headers=headers, data=data, files=files)
    
    if update_resp.status_code == 200:
        print("Profile updated successfully!")
        print(update_resp.json())
    else:
        print(f"Update failed: {update_resp.status_code}")
        print(update_resp.text)

if __name__ == "__main__":
    test_update()
