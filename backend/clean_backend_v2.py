import os
import re

def clean_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Replace emojis with text
        replacements = {
            '✅': '[OK]', '⚠️': '[WARN]', '❌': '[ERROR]', '🔒': '[SECURE]',
            '🚀': '[STARTUP]', '🌐': '[GLOBAL]', '🔥': '[CRITICAL]', '🔔': '[NOTIFY]',
            '🕵️': '[AUTH]', '🔍': '[SEARCH]', '💥': '[CRASH]', '📝': '[INFO]',
            '🖼️': '[IMAGE]', '🛡️': '[GUARD]', '🚨': '[ALERT]', '📥': '[INPUT]',
            '📊': '[STATS]', '📍': '[GPS]', '📄': '[DOC]', '☁️': '[CLOUD]', '🌟': '[STAR]'
        }
        
        new_content = content
        for emoji, text in replacements.items():
            new_content = new_content.replace(emoji, text)
            
        # Remove any other non-ASCII characters
        new_content = ''.join([i if ord(i) < 128 else '?' for i in new_content])
        
        if new_content != content:
            with open(file_path, 'w', encoding='ascii', errors='ignore') as f:
                f.write(new_content)
            print(f"Cleaned: {file_path}")
            
    except Exception as e:
        print(f"Failed to clean {file_path}: {e}")

backend_dir = r"c:\Users\sarip\Downloads\Task-Trail-master (4)\Task-Trail-master\backend\app"
for root, dirs, files in os.walk(backend_dir):
    if 'venv' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith('.py'):
            clean_file(os.path.join(root, file))
