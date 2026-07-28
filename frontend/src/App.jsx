import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthCard } from './components/AuthCard';
import { Dashboard } from './components/Dashboard';
import { Code2 } from 'lucide-react';
import './index.css';

const MainContent = () => {
  const { isAuthenticated, loading } = useAuth();

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
      <Navbar />

      {/* Main View switching between Auth Form and Dashboard */}
      {isAuthenticated ? <Dashboard /> : <AuthCard />}
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
