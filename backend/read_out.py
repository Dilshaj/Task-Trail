import os

# Read the file and print it
with open("projects_out.txt", "rb") as f:
    content = f.read()
    
# Try to decode from UTF-16LE or UTF-8
try:
    print(content.decode('utf-16'))
except:
    print(content.decode('utf-8', errors='ignore'))
