import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProblemActionsProvider } from './context/ProblemActionsContext';
import { Navbar } from './components/Navbar';
import { AuthCard } from './components/AuthCard';
import { DashboardTiles } from './components/DashboardTiles';
import { ProblemsetDashboard } from './components/ProblemsetDashboard';
import { ProblemPage } from './pages/ProblemPage';
import { AddProblemPage } from './pages/AddProblemPage';
import { AdminUserManagement } from './components/AdminUserManagement';
import { Dashboard as UserProfile } from './components/Dashboard';
import { ProtectedRoute, GuestRoute, AdminRoute, SetterOrAdminRoute } from './components/Guards';
import './index.css';

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Atmosphere Effect */}
      <div className="auth-bg-wrapper">
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow-orb" />
      </div>

      {/* Top Navbar */}
      <Navbar />

      {/* Page View */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
};

const DashboardHome = () => {
  return (
    <div style={{ padding: '2rem 1.5rem 4rem 1.5rem', flex: 1, position: 'relative', zIndex: 1 }}>
      <DashboardTiles />
      <ProblemsetDashboard />
    </div>
  );
};

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Layout>
      <Routes>
        {/* Guest Routes (/login, /register) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<AuthCard />} />
          <Route path="/register" element={<AuthCard />} />
        </Route>

        {/* Protected Routes (/dashboard, /problems, /problems/:id, /profile) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/problems" element={<ProblemsetDashboard />} />
          <Route path="/problems/:id" element={<ProblemPage />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>

        {/* Admin & Setter Routes (/admin, /admin/add-problem) */}
        <Route element={<SetterOrAdminRoute />}>
          <Route path="/admin/add-problem" element={<AddProblemPage />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminUserManagement />} />
        </Route>

        {/* Root & Fallback Redirects */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Layout>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProblemActionsProvider>
          <AppRoutes />
        </ProblemActionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
