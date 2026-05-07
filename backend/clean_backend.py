import os
import re

def clean_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove emojis and other non-ASCII characters
    # Keep some common symbols if needed, but for logs, ASCII is safer.
    # We replace with a space or a generic symbol.
    
    # Remove specific emojis found in the codebase
    content = content.replace('✅', '[OK]')
    content = content.replace('⚠️', '[WARN]')
    content = content.replace('❌', '[ERROR]')
    content = content.replace('🔒', '[SECURE]')
    content = content.replace('🚀', '[STARTUP]')
    content = content.replace('🌐', '[GLOBAL]')
    content = content.replace('🔥', '[CRITICAL]')
    content = content.replace('🔔', '[NOTIFY]')
    content = content.replace('🕵️', '[AUTH]')
    content = content.replace('🔍', '[SEARCH]')
    content = content.replace('💥', '[CRASH]')
    content = content.replace('📝', '[INFO]')
    content = content.replace('🖼️', '[IMAGE]')
    content = content.replace('🛡️', '[GUARD]')
    content = content.replace('🚨', '[ALERT]')
    content = content.replace('📥', '[INPUT]')
    content = content.replace('📊', '[STATS]')
    content = content.replace('📍', '[GPS]')
    content = content.replace('📄', '[DOC]')
    content = content.replace('☁️', '[CLOUD]')
    content = content.replace('🌟', '[STAR]')
    
    # Generic non-ASCII removal (replace with ?)
    content = ''.join([i if ord(i) < 128 else '?' for i in content])
    
    # Special fix for task_service.py logging
    if 'task_service.py' in file_path:
        content = re.sub(r'# Set up logging to the existing backend_debug\.log.*?logger\.setLevel\(logging\.INFO\)', 
                        '# Using global logging', content, flags=re.DOTALL)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

backend_dir = r"c:\Users\sarip\Downloads\Task-Trail-master (4)\Task-Trail-master\backend"
for root, dirs, files in os.walk(backend_dir):
    for file in files:
        if file.endswith('.py'):
            clean_file(os.path.join(root, file))
