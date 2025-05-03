import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  // Brighter, life-themed color palette
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #073b4c 0%, #061a40 100%)',
      padding: '3rem 1rem',
      color: '#ffffff',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    gridOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
      backgroundSize: '20px 20px',
      zIndex: 1,
    },
    cells: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      zIndex: 1,
    },
    cell: {
      position: 'absolute',
      borderRadius: '50%',
      background: 'rgba(10, 220, 120, 0.2)',
      boxShadow: '0 0 15px rgba(10, 220, 120, 0.5)',
      animation: 'pulse 2s infinite ease-in-out',
    },
    title: {
      fontSize: '3.5rem',
      fontWeight: '700',
      background: 'linear-gradient(45deg, #06d6a0, #0aefff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 10px rgba(6, 214, 160, 0.3)',
      marginBottom: '1rem',
      zIndex: 2,
      position: 'relative',
    },
    subtitle: {
      fontSize: '1.3rem',
      color: '#90e0ef',
      marginBottom: '2rem',
      fontWeight: '400',
      zIndex: 2,
      position: 'relative',
    },
    content: {
      maxWidth: '700px',
      background: 'rgba(8, 24, 58, 0.7)',
      backdropFilter: 'blur(10px)',
      borderRadius: '24px',
      padding: '3rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(10, 220, 120, 0.2)',
      zIndex: 2,
      position: 'relative',
    },
    buttonContainer: {
      margin: '2rem 0',
      display: 'flex',
      gap: '2rem',
      justifyContent: 'center',
    },
    button: {
      padding: '1.2rem 2.5rem',
      borderRadius: '12px',
      border: 'none',
      background: 'linear-gradient(45deg, #06d6a0, #0aefff)',
      color: '#073b4c',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(6, 214, 160, 0.4)',
    },
    description: {
      fontSize: '1.2rem',
      lineHeight: '1.7',
      color: '#ffffff',
      marginBottom: '2rem',
      fontWeight: '300',
    },
    highlight: {
      color: '#06d6a0',
      fontWeight: '500',
    }
  };

  // Create 5 random cell positions for background effect
  const cellPositions = React.useMemo(() => {
    return Array(15).fill().map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 80 + 20}px`,
      delay: `${Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.gridOverlay} />
      
      {/* Animated cells in background */}
      <div style={styles.cells}>
        {cellPositions.map((pos, idx) => (
          <div 
            key={idx} 
            style={{
              ...styles.cell, 
              left: pos.left, 
              top: pos.top, 
              width: pos.size, 
              height: pos.size,
              animationDelay: pos.delay
            }} 
          />
        ))}
      </div>
      
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.2); opacity: 0.5; }
            100% { transform: scale(1); opacity: 0.2; }
          }
        `}
      </style>
      
      <div style={styles.content}>
        <h1 style={styles.title}>PeachTri Dish!</h1>
        <h2 style={styles.subtitle}>By: Jonathan Ermias, Kayla Clark, Jimmy Tran</h2>
        
        <p style={styles.description}>
          Welcome to our interactive <span style={styles.highlight}>Game of Life</span> project! 
          Experience the beauty of cellular automata as you watch patterns evolve, 
          interact with living cells, and discover the emergent complexity from simple rules. This Game
          models <span style={styles.highlight}>Conway's Game of Life</span>. . . Enjoy!
        </p>

        <div style={styles.buttonContainer}>
          <button 
            onClick={() => navigate('/login')}
            style={styles.button}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(6, 214, 160, 0.6)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(6, 214, 160, 0.4)';
            }}
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/register')}
            style={styles.button}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(6, 214, 160, 0.6)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(6, 214, 160, 0.4)';
            }}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}