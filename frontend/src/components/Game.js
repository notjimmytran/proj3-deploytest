import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const GRID_SIZE = 20; // Adjust grid size as needed

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
  const [grid, setGrid] = useState(() => {
    const rows = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    return rows;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0); // Add population counter
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;

  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;

    setGrid(g => {
      const nextGen = g.map((row, i) =>
        row.map((cell, j) => {
          let neighbors = 0;
          // Check all 8 neighbors
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const newI = (i + di + GRID_SIZE) % GRID_SIZE;
              const newJ = (j + dj + GRID_SIZE) % GRID_SIZE;
              if (g[newI][newJ]) neighbors++;
            }
          }
          // Conway's Game of Life rules
          if (cell && (neighbors < 2 || neighbors > 3)) return false;
          if (!cell && neighbors === 3) return true;
          return cell;
        })
      );
      setGeneration(prev => prev + 1);
      // Update population count
      const newPopulation = nextGen.reduce((sum, row) => 
        sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
      );
      setPopulation(newPopulation);
      return nextGen;
    });

    setTimeout(runSimulation, 100);
  }, []);

  // Function to load a pattern
  const loadPattern = (patternName) => {
    const pattern = PATTERNS[patternName].pattern;
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    
    // Calculate center position to place pattern
    const startI = Math.floor((GRID_SIZE - pattern.length) / 2);
    const startJ = Math.floor((GRID_SIZE - pattern[0].length) / 2);
    
    // Place pattern in center of grid
    for (let i = 0; i < pattern.length; i++) {
      for (let j = 0; j < pattern[i].length; j++) {
        newGrid[startI + i][startJ + j] = pattern[i][j] === 1;
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
                const newI = (i + di + GRID_SIZE) % GRID_SIZE;
                const newJ = (j + dj + GRID_SIZE) % GRID_SIZE;
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
      setGeneration(g => g + 1);
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between generations
    }
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
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setGeneration(0);
    setIsRunning(false);
    setPopulation(0);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #073b4c 0%, #061a40 100%)',
      padding: '2rem',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h2 style={{ color: '#90e0ef' }}>Generation: {generation}</h2>
            <h3 style={{ color: '#90e0ef' }}>Population: {population}</h3>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#ff686b',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 25px)`,
          gap: '1px',
          background: '#1a1a1a',
          padding: '1px',
          marginBottom: '1rem',
          justifyContent: 'center'
        }}>
          {grid.map((row, i) =>
            row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                onClick={() => toggleCell(i, j)}
                style={{
                  width: '25px',
                  height: '25px',
                  backgroundColor: cell ? '#06d6a0' : '#2a2a2a',
                  border: '1px solid #333',
                  cursor: 'pointer'
                }}
              />
            ))
          )}
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap'
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
              cursor: 'pointer'
            }}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setGrid(g => {
                const nextGen = g.map((row, i) =>
                  row.map((cell, j) => {
                    let neighbors = 0;
                    for (let di = -1; di <= 1; di++) {
                      for (let dj = -1; dj <= 1; dj++) {
                        if (di === 0 && dj === 0) continue;
                        const newI = (i + di + GRID_SIZE) % GRID_SIZE;
                        const newJ = (j + dj + GRID_SIZE) % GRID_SIZE;
                        if (g[newI][newJ]) neighbors++;
                      }
                    }
                    if (cell && (neighbors < 2 || neighbors > 3)) return false;
                    if (!cell && neighbors === 3) return true;
                    return cell;
                  })
                );
                const newPopulation = nextGen.reduce((sum, row) => 
                  sum + row.reduce((rowSum, cell) => rowSum + (cell ? 1 : 0), 0), 0
                );
                setPopulation(newPopulation);
                setGeneration(prev => prev + 1);
                return nextGen;
              });
            }}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0aefff',
              color: 'white',
              cursor: 'pointer'
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
              cursor: 'pointer'
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
              cursor: 'pointer'
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
              cursor: 'pointer'
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