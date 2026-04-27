# EduProva Production Deployment Guide

This guide details the steps to transition this project from a local development environment to a secure, stable, and high-performance production environment on AWS.

## 1. Backend Optimization (Done)
- **Gunicorn**: We've switched to Gunicorn with the `UvicornWorker` for efficient process management.
- **Logging**: Switched from `print` to professional `logging` in `app/main.py`.
- **CORS**: Restricted origins to specific domains in `app/core/config.py`.

## 2. Server Configuration
### Nginx Reverse Proxy
Place the provided `deployment/nginx.conf` into `/etc/nginx/sites-available/eduprova` and link it to `sites-enabled`. This configuration:
- Serves the frontend `dist/` folder directly.
- Proxies `/api` requests to the Gunicorn backend running on port 8000.
- Handles static files (avatars/logos).

### Systemd Process Management
Use the provided `deployment/backend.service` to manage the backend.
```bash
sudo cp deployment/backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable backend
sudo systemctl start backend
```
This ensures the backend restarts automatically on failure or server reboot.

## 3. Security
### HTTPS with Certbot
Install Certbot and obtain an SSL certificate for your domain:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```
This will automatically update your Nginx configuration to support HTTPS.

### Environment Variables
- Ensure your `.env` file on the server contains production credentials.
- Do **NOT** commit the `.env` file to your repository (already in `.gitignore`).

## 4. Frontend Deployment
1. Build the frontend: `npm run build`
2. Move the `dist/` folder to your server's web directory (e.g., `/var/www/frontend`).
3. Nginx will serve these files as per the `nginx.conf`.

## 5. Domain Setup
1. Point your domain (A record) to the AWS EC2 Elastic IP.
2. In `app/core/config.py`, update `ALLOWED_ORIGINS` to include your actual domain.
3. In the frontend `.env`, set `VITE_API_BASE_URL` to your production URL (or let it fallback to `/api` as configured).

---

**Current Status**: All configuration files for Gunicorn, Nginx, and Systemd have been created in the `deployment/` directory. The codebase has been adjusted for production-grade security and stability.
