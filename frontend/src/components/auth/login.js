import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await login(formData);
      if (response.success) {
        // Store user in localStorage or context
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/game'); // Redirect to game page after login
      } else {
        setMessage(response.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #073b4c 0%, #061a40 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    },
    form: {
      background: 'rgba(8, 24, 58, 0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: '24px',
      padding: '3rem',
      width: '100%',
      maxWidth: '450px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(10, 220, 120, 0.2)',
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      background: 'linear-gradient(45deg, #06d6a0, #0aefff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      marginBottom: '2rem',
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#90e0ef',
      fontSize: '1rem',
      textAlign: 'left',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '12px',
      border: '1px solid rgba(10, 220, 120, 0.3)',
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#fff',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
    },
    button: {
      width: '100%',
      padding: '1rem',
      borderRadius: '12px',
      border: 'none',
      background: 'linear-gradient(45deg, #06d6a0, #0aefff)',
      color: '#073b4c',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '1rem',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    message: {
      color: '#ff686b', // Error message color
      marginTop: '1rem',
      textAlign: 'center',
    },
    link: {
      display: 'block',
      marginTop: '1.5rem',
      color: '#90e0ef',
      textAlign: 'center',
      cursor: 'pointer',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h1 style={styles.title}>Login</h1>
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          {message && <p style={styles.message}>{message}</p>}
          <button 
            type="submit" 
            style={styles.button}
            disabled={isLoading}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(6, 214, 160, 0.5)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>
        <p style={styles.link} onClick={() => navigate('/register')}>
          Don't have an account? Register
        </p>
        <p style={styles.link} onClick={() => navigate('/')}>
          Back to Home
        </p>
      </div>
    </div>
  );
}