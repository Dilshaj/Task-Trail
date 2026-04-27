import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProjectProvider } from './context/ProjectContext';
import { TaskProvider } from './context/TaskContext';
import { AttendanceProvider } from './context/AttendanceContext';
import { LeaveProvider } from './context/LeaveContext';
import { useState, useEffect } from 'react';
import { ProjectFilterProvider } from './context/ProjectFilterContext';

import PageLoader from './components/PageLoader';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ProjectDashboard from './pages/ProjectDashboard';
import EmployeeDetails from './pages/EmployeeDetails';
import UserDashboard from './pages/UserDashboard';
import AttendancePanel from './pages/AttendancePanel';
import UserProfile from './pages/UserProfile';
import LeavePanel from './pages/LeavePanel';
import OfferLetterPanel from './pages/OfferLetterPanel';
import UserOfferLetter from './pages/UserOfferLetter';
import ApplyLeave from './pages/ApplyLeave';
import EmployeesPanel from './pages/EmployeesPanel';
import PaySlipPanel from './pages/PaySlipPanel';

const PrivateRoute = ({ children, roleRequired }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;
  if (roleRequired && user.role?.toLowerCase() !== roleRequired) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/admin"
        element={
          <PrivateRoute roleRequired="admin">
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/project-dashboard"
        element={
          <PrivateRoute roleRequired="admin">
            <ProjectDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/project/:id"
        element={<Navigate to="/project-dashboard" replace />}
      />
      <Route
        path="/admin/employees"
        element={
          <PrivateRoute roleRequired="admin">
            <EmployeesPanel />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/employee/:id"
        element={
          <PrivateRoute roleRequired="admin">
            <EmployeeDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <PrivateRoute roleRequired="admin">
            <AttendancePanel />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/leaves"
        element={
          <PrivateRoute roleRequired="admin">
            <LeavePanel isAdmin={true} />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/offer-letter"
        element={
          <PrivateRoute roleRequired="admin">
            <OfferLetterPanel />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin/pay-slip"
        element={
          <PrivateRoute roleRequired="admin">
            <PaySlipPanel />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <UserDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/apply-leave"
        element={
          <PrivateRoute>
            <ApplyLeave />
          </PrivateRoute>
        }
      />
      <Route
        path="/offer-letter"
        element={
          <PrivateRoute>
            <UserOfferLetter />
          </PrivateRoute>
        }
      />
      <Route
        path="/leaves"
        element={
          <PrivateRoute>
            <LeavePanel isAdmin={false} />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <UserProfile />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1500); // 1.5 seconds loading intro
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ProjectProvider>
            <ProjectFilterProvider>
              <TaskProvider>
                <AttendanceProvider>
                  <LeaveProvider>
                    <AppRoutes />
                  </LeaveProvider>
                </AttendanceProvider>
              </TaskProvider>
            </ProjectFilterProvider>
          </ProjectProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
