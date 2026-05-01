# EduProva: Enterprise Management Platform

A robust, full-stack management system designed for tracking employee productivity, dynamic document generation, and real-time attendance with geolocation. Built for scalability and production performance on AWS.

---

## 🌟 Key Features

- **🚀 Advanced Task Tracking**: Granular 0-100% progress tracking with automatic daily/weekly work average calculations.
- **🔐 Enterprise Security**: Dual-token JWT system (Access & Refresh tokens) with silent session renewal and database-backed revocation.
- **📍 Smart Attendance**: Geolocation-tagged check-in/out with automated office distance verification and Excel report exports.
- **📄 Dynamic Document Engine**: Automated PDF generation for **Pay Slips** (with salary breakdown) and **Offer Letters** using Jinja2 templates.
- **☁️ Cloud-Native Profile storage**: Seamless integration with **Cloudinary** for employee avatars with automatic local fallbacks.
- **📊 Admin Control Center**: Real-time project health metrics, team activity feeds, and employee performance analytics.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.9+), MongoDB Atlas, motor (Async Driver).
- **Frontend**: React.js, Vite, Tailwind CSS, Lucide Icons.
- **Deployment**: AWS EC2, Nginx (Reverse Proxy), Gunicorn/Uvicorn, PM2/Systemd.
- **Extras**: xhtml2pdf, Cloudinary SDK, JWT (jose).

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate: .\venv\Scripts\activate (Windows) or source venv/bin/activate (Linux)
pip install -r requirements.txt
cp .env.example .env  # Update with your MongoDB/Cloudinary keys
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd work-updates
npm install
npm run dev
```

---

## ☁️ AWS Deployment (Production)

This project is pre-configured for AWS EC2 using a single-command deployment script.

1. **Clone to EC2**: `git clone https://github.com/Dilshaj/Task-Trail.git /var/www/work-updates`
2. **Execute Deployment**:
   ```bash
   cd /var/www/work-updates
   chmod +x deploy_aws.sh
   ./deploy_aws.sh
   ```
3. **Nginx & Systemd**: The script automatically configures Nginx (`deployment/nginx.conf`) and sets up the backend as a background service (`deployment/backend.service`).

---

## 📁 Repository Structure
- `/backend`: FastAPI application, models, and service layer.
- `/work-updates`: React frontend application.
- `/deployment`: Production configuration files (Nginx, Gunicorn, systemd).
- `/static`: Static assets such as logos and company templates.

---

## 🔑 Security Note
This repository includes a `.env.example` file. **Never push your actual `.env` file to GitHub.** The current `.gitignore` is configured to protect your secrets.

Developed by **Dilshaj Infotech**.
