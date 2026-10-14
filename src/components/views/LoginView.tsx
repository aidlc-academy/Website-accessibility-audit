import React, { useState } from 'react';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, fullName };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'The login service is unavailable. Start AccessLens with "npm run dev" and try again.',
        );
      }

      if (!data) {
        throw new Error('The login service returned an invalid response. Please try again.');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
      } else {
        // After registration, switch to login
        setIsLogin(true);
        setPassword('');
        setFullName('');
        setError('✓ Registration successful! Please log in with your new account.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {showWelcome && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              lineHeight: '1.5',
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>👋 Welcome to AccessLens!</p>
              <p style={{ margin: '0', fontSize: '13px', opacity: 0.9 }}>
                {isLogin 
                  ? 'Login with your account or create a new one to get started'
                  : 'Create your account to start auditing websites'}
              </p>
              <button
                onClick={() => setShowWelcome(false)}
                style={{
                  marginTop: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Got it
              </button>
            </div>
          )}
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            AccessLens
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Website Accessibility Audit Assistant
          </p>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '8px' }}>
            Administrators and users sign in here with their account credentials.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#f5f5f5',
          padding: '4px',
          borderRadius: '8px',
        }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: isLogin ? 'white' : 'transparent',
              color: isLogin ? '#667eea' : '#666',
              fontWeight: isLogin ? '600' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: isLogin ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              background: !isLogin ? 'white' : 'transparent',
              color: !isLogin ? '#667eea' : '#666',
              fontWeight: !isLogin ? '600' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: !isLogin ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            background: error.includes('successful') ? '#d4edda' : '#f8d7da',
            color: error.includes('successful') ? '#155724' : '#721c24',
            borderRadius: '6px',
            fontSize: '14px',
            border: `1px solid ${error.includes('successful') ? '#c3e6cb' : '#f5c6cb'}`,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLogin}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#333',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={8}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            {!isLogin && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Must be at least 8 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #eee',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '13px',
            color: '#666',
            margin: 0,
          }}>
            {isLogin 
              ? "Don't have an account? Switch to Register tab above"
              : "Already have an account? Switch to Login tab above"}
          </p>
        </div>
      </div>
    </div>
  );
};
