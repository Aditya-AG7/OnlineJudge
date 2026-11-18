import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{
        backgroundColor: '#121218',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '3rem 2.5rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 59, 48, 0.12)',
          border: '1px solid rgba(255, 59, 48, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          color: '#ff3b30',
        }}>
          <AlertCircle size={32} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: '0.5rem',
        }}>
          404
        </h1>

        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.2rem',
          fontWeight: 600,
          color: '#f4f4f7',
          marginBottom: '0.75rem',
        }}>
          Page Not Found
        </h2>

        <p style={{
          color: '#9da3ae',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          marginBottom: '2rem',
        }}>
          The page you are looking for doesn't exist, has been moved, or the URL might be mistyped.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#f4f4f7',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1, padding: '0.75rem 1rem' }}
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
          >
            <Home size={16} />
            <span>{isAuthenticated ? 'Dashboard' : 'Login'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
