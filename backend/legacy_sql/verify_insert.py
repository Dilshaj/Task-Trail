import requests
import pyodbc
import json
import os
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

# Test Payload
payload = {
    'employee_id': 'EMP_TEST_VERIFY_999',
    'name': 'Test Verification Employee',
    'email': 'test_verify@eduprova.com',
    'password': 'user',
    'role': 'Verification Specialist',
    'projectId': 'p1'
}

print('1. SENDING POST REQUEST TO BACKEND...')
try:
    r = requests.post('http://127.0.0.1:5000/api/employees', json=payload, timeout=15)
    print(f'STATUS CODE: {r.status_code}')
    print(f'RESPONSE: {r.text}')
except Exception as e:
    print(f'HTTP ERROR: {e}')

print('\n2. VERIFYING DIRECTLY IN RDS DATABASE...')
# Construct Connection String with driver fallback
server = os.getenv("DB_HOST")
database = os.getenv("DB_NAME")
uid = os.getenv("DB_USER")
pwd = os.getenv("DB_PASSWORD")

drivers = ['ODBC Driver 18 for SQL Server', 'ODBC Driver 17 for SQL Server', 'SQL Server']
conn = None

for drv in drivers:
    try:
        c_str = f'DRIVER={{{drv}}};SERVER={server};DATABASE={database};UID={uid};PWD={pwd};Encrypt=yes;TrustServerCertificate=yes'
        print(f'Attempting connection with: {drv}')
        conn = pyodbc.connect(c_str, timeout=10)
        print(f'SUCCESS: Connected with {drv}')
        break
    except Exception as e:
        last_error = e
        continue

if not conn:
    print(f'DATABASE ERROR: Failed to connect after multiple tries. Last error: {last_error}')
    exit(1)

try:
    cursor = conn.cursor()
    # Check what columns actually exist
    cursor.execute("SELECT TOP 1 * FROM employees_table")
    columns = [column[0] for column in cursor.description]
    print(f"ACTUAL COLUMNS FOUND IN 'employees_table': {columns}")
    
    # Check if the row exists
    cursor.execute("SELECT * FROM employees_table WHERE employee_id = 'EMP_TEST_VERIFY_999'")
    row = cursor.fetchone()
    if row:
        print('SUCCESS: Found employee in RDS!')
        # Iterate over columns to find indices
        data_dict = dict(zip(columns, row))
        print(f"DB DATA -> {data_dict}")
    else:
        print('FAILURE: Employee NOT found in RDS.')
    conn.close()
except Exception as e:
    print(f'QUERY ERROR: {e}')
