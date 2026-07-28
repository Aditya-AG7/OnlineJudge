import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthCard } from './components/AuthCard';
import { ProblemsetDashboard } from './components/ProblemsetDashboard';
import { AdminUserManagement } from './components/AdminUserManagement';
import { Code2 } from 'lucide-react';
import './index.css';

const MainContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeView, setActiveView] = useState('problemset'); // 'problemset' | 'admin'

  // Update default view whenever user logs in or role changes
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.type === 'admin') {
        setActiveView('admin'); // Admin logs in -> directly redirect to Admin User Management
      } else {
        setActiveView('problemset'); // Standard user -> LeetCode-style Problemset
      }
    }
  }, [isAuthenticated, user?.type]);

  if (loading) {
    return (
      <div className="auth-bg-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#9da3ae' }}>
          <Code2 size={40} className="brand-icon spin-icon" style={{ marginBottom: '1rem', color: '#ff3b30' }} />
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Initializing OnlineJudge...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Atmosphere Effect */}
      <div className="auth-bg-wrapper">
        <div className="auth-bg-grid" />
        <div className="auth-bg-glow-orb" />
      </div>

      {/* Top Navbar */}
      <Navbar activeView={activeView} setActiveView={setActiveView} />

      {/* Main View Switching */}
      {!isAuthenticated ? (
        <AuthCard />
      ) : activeView === 'admin' && user?.type === 'admin' ? (
        <AdminUserManagement />
      ) : (
        <ProblemsetDashboard />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
