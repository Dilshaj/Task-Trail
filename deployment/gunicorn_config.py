import multiprocessing
import os

# Binding to localhost ONLY for maximum security as per 'Only Port 80' requirement
# Nginx (port 80) will proxy traffic internally to this port.
bind = "127.0.0.1:5000"

# Gunicorn Workers optimization (2 * CPU cores + 1)
workers = multiprocessing.cpu_count() * 2 + 1

# Worker type for FastAPI/ASGI compliance
worker_class = "uvicorn.workers.UvicornWorker"

# Process management
daemon = False # Typically False for Supervisor to manage the process foreground
timeout = 120
keepalive = 2

# Logging
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"

# Security
# Set the user and group as per your AWS server config (e.g. www-data)
# user = "www-data" 
# group = "www-data"
