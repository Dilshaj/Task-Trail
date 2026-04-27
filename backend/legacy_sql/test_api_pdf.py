import requests
import os

URL = "http://127.0.0.1:8000/api/offer-letter/2026999"

def test_download():
    print(f"Testing download from {URL}...")
    try:
        response = requests.get(URL)
        print(f"Status: {response.status_code}")
        print(f"Headers: {response.headers}")
        
        if response.status_code == 200:
            content = response.content
            print(f"Downloaded {len(content)} bytes")
            if len(content) > 0:
                with open("download_test.pdf", "wb") as f:
                    f.write(content)
                print("PDF saved as download_test.pdf")
                
                # Check start of file
                if content.startswith(b"%PDF"):
                    print("File starts with valid PDF signature!")
                else:
                    print("WARNING: File does NOT start with %PDF signature!")
                    print(f"Preview (hex): {content[:32].hex()}")
                    print(f"Preview (text): {content[:100]}")
            else:
                print("ERORR: Zero bytes downloaded!")
        else:
            print(f"Download FAILED: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_download()
