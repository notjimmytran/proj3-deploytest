import React, { useEffect, useState } from 'react';
import { getUserStats } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getUserStats().then(res => {
      if (res.success) {
        setStats(res);
      } else {
        setError(res.error || 'Failed to load stats');
      }
      setLoading(false);
    });
  }, []);

  // Logout handler
  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div style={{ color: '#06d6a0', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;
  if (error) return <div style={{ color: '#ff686b', textAlign: 'center', marginTop: '2rem' }}>{error}</div>;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #073b4c 0%, #061a40 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(8, 24, 58, 0.7)',
        borderRadius: '24px',
        padding: '3rem',
        minWidth: '320px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        border: '1px solid rgba(10, 220, 120, 0.2)',
        color: '#fff'
      }}>
        <h1 style={{
          fontSize: '2.2rem',
          fontWeight: '700',
          background: 'linear-gradient(45deg, #06d6a0, #0aefff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Player Dashboard
        </h1>
        <div style={{ fontSize: '1.2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <strong>Username:</strong> {stats.username}
        </div>
        <div style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          <strong>Total Games Played:</strong> {stats.total_games}
        </div>
        <div style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          <strong>Total Patterns Saved:</strong> {stats.total_patterns}
        </div>
        <div style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
          <strong>Best Generation:</strong> {stats.best_generation}
        </div>
        <div style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          <strong>Best Population:</strong> {stats.best_population}
        </div>
        <button
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(45deg, #06d6a0, #0aefff)',
            color: '#073b4c',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
          onClick={() => navigate('/game')}
        >
          Back to Game
        </button>
        <button
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '12px',
            border: 'none',
            background: '#ff686b',
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}