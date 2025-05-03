import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// We'll calculate GRID_SIZE dynamically
const CELL_SIZE = 25; // Keep cell size constant

// Predefined patterns
const PATTERNS = {
  // Still Life Patterns
  block: {
    name: 'Block',
    pattern: [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ]
  },
  beehive: {
    name: 'Beehive',
    pattern: [
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [0, 1, 1, 0]
    ]
  },
  // Oscillator Patterns
  blinker: {
    name: 'Blinker',
    pattern: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0]
    ]
  },
  beacon: {
    name: 'Beacon',
    pattern: [
      [1, 1, 0, 0],
      [1, 1, 0, 0],
      [0, 0, 1, 1],
      [0, 0, 1, 1]
    ]
  },
  // Bonus: Glider Pattern
  glider: {
    name: 'Glider',
    pattern: [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1]
    ]
  }
};

export default function Game() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const containerRef = useRef(null);
  const [gridSize, setGridSize] = useState({ rows: 20, cols: 20 });
  const [grid, setGrid] = useState(() => {
    return Array(20).fill(null).map(() => Array(20).fill(false));
  });
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;

  // Calculate grid dimensions based on container size
  useEffect(() => {
    const updateGridSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const cols = Math.floor(containerWidth / CELL_SIZE);
        const rows = Math.floor(containerHeight / CELL_SIZE);
        
        if (cols !== gridSize.cols || rows !== gridSize.rows) {
          setGridSize({ rows, cols });
          setGrid(Array(rows).fill(null).map(() => Array(cols).fill(false)));
          setGeneration(0);
          setPopulation(0);
          setIsRunning(false);
        }
      }
    };

    updateGridSize();
    window.addEventListener('resize', updateGridSize);
    return () => window.removeEventListener('resize', updateGridSize);
  }, []);

  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;

    setGrid(g => {
      const nextGen = g.map((row, i) =>
        row.map((cell, j) => {
          let neighbors = 0;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const newI = (i + di + gridSize.rows) % gridSize.rows;
              const newJ = (j + dj + gridSize.cols) % gridSize.cols;
              if (g[newI][newJ]) neighbors++;
            }
          }
          if (cell && (neighbors < 2 || neighbors > 3)) return false;
          if (!cell && neighbors === 3) return true;
          return cell;
        })
      );
      return nextGen;
    });

    // Move generation increment outside of setGrid
    setGeneration(g => g + 1);
    
    // Update population after grid update
    setGrid(currentGrid => {
      const newPopulation = currentGrid.reduce((sum, row) => 
        sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
      );
      setPopulation(newPopulation);
      return currentGrid;
    });

    setTimeout(runSimulation, 100);
  }, [gridSize]);

  // Function to load a pattern
  const loadPattern = (patternName) => {
    if (!patternName) return;
    
    const pattern = PATTERNS[patternName].pattern;
    const newGrid = Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill(false));
    
    const startI = Math.floor((gridSize.rows - pattern.length) / 2);
    const startJ = Math.floor((gridSize.cols - pattern[0].length) / 2);
    
    for (let i = 0; i < pattern.length; i++) {
      for (let j = 0; j < pattern[i].length; j++) {
        if (startI + i < gridSize.rows && startJ + j < gridSize.cols) {
          newGrid[startI + i][startJ + j] = pattern[i][j] === 1;
        }
      }
    }
    
    setGrid(newGrid);
    setGeneration(0);
    const newPopulation = newGrid.reduce((sum, row) => 
      sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
    );
    setPopulation(newPopulation);
  };

  // Function to advance 23 generations
  const advance23Generations = async () => {
    setIsRunning(false);
    for (let i = 0; i < 23; i++) {
      setGrid(g => {
        const nextGen = g.map((row, i) =>
          row.map((cell, j) => {
            let neighbors = 0;
            for (let di = -1; di <= 1; di++) {
              for (let dj = -1; dj <= 1; dj++) {
                if (di === 0 && dj === 0) continue;
                const newI = (i + di + gridSize.rows) % gridSize.rows;
                const newJ = (j + dj + gridSize.cols) % gridSize.cols;
                if (g[newI][newJ]) neighbors++;
              }
            }
            if (cell && (neighbors < 2 || neighbors > 3)) return false;
            if (!cell && neighbors === 3) return true;
            return cell;
          })
        );
        return nextGen;
      });
      
      // Increment generation after grid update
      setGeneration(g => g + 1);
      
      // Update population after all updates
      setGrid(currentGrid => {
        const newPopulation = currentGrid.reduce((sum, row) => 
          sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
        );
        setPopulation(newPopulation);
        return currentGrid;
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  // Update the Next Generation button handler too
  const handleNextGeneration = () => {
    setIsRunning(false);
    setGrid(g => {
      const nextGen = g.map((row, i) =>
        row.map((cell, j) => {
          let neighbors = 0;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const newI = (i + di + gridSize.rows) % gridSize.rows;
              const newJ = (j + dj + gridSize.cols) % gridSize.cols;
              if (g[newI][newJ]) neighbors++;
            }
          }
          if (cell && (neighbors < 2 || neighbors > 3)) return false;
          if (!cell && neighbors === 3) return true;
          return cell;
        })
      );
      return nextGen;
    });
    
    // Increment generation after grid update
    setGeneration(g => g + 1);
    
    // Update population after all updates
    setGrid(currentGrid => {
      const newPopulation = currentGrid.reduce((sum, row) => 
        sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
      );
      setPopulation(newPopulation);
      return currentGrid;
    });
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleCell = (i, j) => {
    const newGrid = grid.map((row, rowIndex) =>
      row.map((cell, colIndex) =>
        rowIndex === i && colIndex === j ? !cell : cell
      )
    );
    setGrid(newGrid);
    const newPopulation = newGrid.reduce((sum, row) => 
      sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
    );
    setPopulation(newPopulation);
  };

  const resetGrid = () => {
    setGrid(Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill(false)));
    setGeneration(0);
    setIsRunning(false);
    setPopulation(0);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #073b4c 0%, #061a40 100%)',
      padding: '2rem',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '90vh'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem'
        }}>
          <div style={{ marginRight: '2rem' }}>
            <h2 style={{ 
              color: '#90e0ef', 
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '500'
            }}>Generation: {generation}</h2>
            <h3 style={{ 
              color: '#90e0ef', 
              margin: '0.5rem 0 0 0',
              fontSize: '1.2rem',
              fontWeight: '500'
            }}>Population: {population}</h3>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#ff686b',
              color: 'white',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            Logout
          </button>
        </div>

        <div 
          ref={containerRef}
          style={{
            width: '100%',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize.cols}, ${CELL_SIZE}px)`,
            gap: '1px',
            background: '#1a1a1a',
            padding: '1px',
          }}>
            {grid.map((row, i) =>
              row.map((cell, j) => (
                <div
                  key={`${i}-${j}`}
                  onClick={() => toggleCell(i, j)}
                  style={{
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                    backgroundColor: cell ? '#06d6a0' : '#2a2a2a',
                    border: '1px solid #333',
                    cursor: 'pointer'
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          padding: '1rem',
          background: 'rgba(26, 26, 26, 0.5)',
          borderRadius: '12px',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => {
              setIsRunning(!isRunning);
              if (!isRunning) {
                runningRef.current = true;
                runSimulation();
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: isRunning ? '#ff686b' : '#06d6a0',
              color: 'white',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={handleNextGeneration}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0aefff',
              color: 'white',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            Next Generation
          </button>
          <button
            onClick={advance23Generations}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0aefff',
              color: 'white',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            +23 Generations
          </button>
          <button
            onClick={resetGrid}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#ff686b',
              color: 'white',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            Reset
          </button>
          <select
            onChange={(e) => loadPattern(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#2a2a2a',
              color: 'white',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            <option value="">Select Pattern</option>
            <optgroup label="Still Life">
              <option value="block">Block</option>
              <option value="beehive">Beehive</option>
            </optgroup>
            <optgroup label="Oscillators">
              <option value="blinker">Blinker</option>
              <option value="beacon">Beacon</option>
            </optgroup>
            <optgroup label="Spaceships">
              <option value="glider">Glider</option>
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  );
} 