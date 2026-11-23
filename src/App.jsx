// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import PublicLayout from './layouts/PublicLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Surveys from './pages/Surveys';
import Responses from './pages/Responses';
import Analytics from './pages/Analytics';
import Clustering from './pages/Clustering';
import Documents from './pages/Documents';
import Users from './pages/Users';
import PublicSurvey from './pages/PublicSurvey';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div>;
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/survey" element={<PublicSurvey />} />
          <Route path="/survey/:id" element={<PublicSurvey />} />
        </Route>

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="surveys" element={<Surveys />} />
          <Route path="responses" element={<Responses />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="clustering" element={<Clustering />} />
          <Route path="documents" element={<Documents />} />
          <Route path="users" element={<Users />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
