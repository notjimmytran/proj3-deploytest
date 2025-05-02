import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/auth';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...userData } = formData;
      const response = await register(userData);
      
      if (response.success) {
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(response.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
      console.error('Register error:', error);
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
      color: message && message.includes('successful') ? '#06d6a0' : '#ff686b',
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
        <h1 style={styles.title}>Register</h1>
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
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
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
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
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
            {isLoading ? 'Processing...' : 'Register'}
          </button>
        </form>
        <p style={styles.link} onClick={() => navigate('/login')}>
          Already have an account? Login
        </p>
        <p style={styles.link} onClick={() => navigate('/')}>
          Back to Home
        </p>
      </div>
    </div>
  );
}