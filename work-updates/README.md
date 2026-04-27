# EduProva Project Management System

A premium, modern React-based project management dashboard designed for high-performance teams.

## 🚀 Technology Stack
- **Frontend**: React 18+ (Vite)
- **Styling**: Tailwind CSS v4 (Modern Color System, Glassmorphism)
- **Icons**: Lucide React
- **Animation**: Framer Motion & CSS keyframe animations
- **State Management**: React Context API
- **Routing**: React Router v6

---

## 📂 Project Structure

```text
├── src/
│   ├── components/       # Reusable UI components (Sidebar, Navbar, Modals)
│   ├── context/          # State management (Auth, Projects, Tasks, Attendance, Theme)
│   ├── pages/            # Main view components (Dashboard, Login, Details)
│   ├── services/         # API abstraction layer and dummy data
│   ├── assets/           # Global styles and branding assets
│   ├── App.jsx           # Main application router
│   └── index.css         # Global design system and Tailwind v4 configuration
```

---

## 🔧 Backend Integration Guide (for Backend Developers)

Currently, the application uses **Services** to simulate backend interactions with dummy data. To integrate a real API:

### 1. API Endpoint Configuration
Replace the Promise-based dummy data in the following files with real `axios` or `fetch` calls:
- `src/services/authService.js`: Authentication logic and user sessions.
- `src/services/projectService.js`: CRUD operations for projects.
- `src/services/taskService.js`: Task management, employee lists, and progress tracking.

### 2. Authentication Flow
The app uses Context API (`AuthContext.jsx`) to manage current user state. Ensure your backend returns:
- User ID
- Name
- Role (`admin` or `user`)
- Avatar URL
- Auth Token (JWT)

---

## 🛠️ DevOps & Deployment Guide (for DevOps Engineers)

### 1. Build Process
```bash
npm install
npm run build
```
Vite will generate the production build in the `dist/` directory.

### 2. Path Configuration & Base URL
If deploying to a subdirectory (e.g., `domain.com/dashboard/`), ensure you update:
- `vite.config.js`: Set the `base` property.
- `src/App.jsx`: Update the `BrowserRouter` basename if necessary.

### 3. Environment Variables
Create a `.env` file for API base URLs:
```env
VITE_API_URL=https://api.eduprova.com/v1
```
Then use `import.meta.env.VITE_API_URL` within the services layer.

### 4. Branding Assets
The core branding resides in `src/pages/`:
- `edu-logo.png`: Primary icon (used for badges and projects).
- `edu-heading.png`: Full company heading (used in Sidebar/Navbar).

---

## 🔑 Demo Credentials
For testing purposes, the login page features an "Auto-fill" option for:
- **Admin**: admin@eduprova.com / admin123
- **User**: user@eduprova.com / user123

---

## 🎨 Design System
The project uses a custom-tuned **Tailwind CSS v4** system. All primary colors, glass effects, and animations are defined in `src/index.css`. Keep the `primary`, `secondary`, and `glass` utility classes consistent during expansion.

---
*Developed with focus on premium UI/UX for EduProva.*
