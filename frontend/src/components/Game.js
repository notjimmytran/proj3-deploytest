import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Add throttle utility at the top
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const MIN_CELL_SIZE = 15;
const MAX_CELL_SIZE = 40;
const DEFAULT_CELL_SIZE = 25;
const DEFAULT_GRID_SIZE = 50;

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

const VIEWPORT_SIZE = 40; // Increased viewport size for better coverage

export default function Game() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const containerRef = useRef(null);
  const [gridSize, setGridSize] = useState({ rows: DEFAULT_GRID_SIZE, cols: DEFAULT_GRID_SIZE });
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [grid, setGrid] = useState(() => new Map());
  const [position, setPosition] = useState(() => ({ x: 0, y: 0 }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;
  const positionRef = useRef(position);
  positionRef.current = position;

  // Helper function to get cell key
  const getCellKey = (row, col) => `${row},${col}`;

  // Define all useCallback hooks at the top level
  const toggleCell = useCallback((row, col) => {
    const key = getCellKey(row, col);
    setGrid(prevGrid => {
      const newGrid = new Map(prevGrid);
      if (newGrid.has(key)) {
        newGrid.delete(key);
      } else {
        newGrid.set(key, true);
      }
      return newGrid;
    });
  }, []);

  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;

    setGrid(g => {
      const newGrid = new Map();
      const activeCells = new Set();
      
      // Collect all active cells and their neighbors
      for (const [key] of g) {
        const [row, col] = key.split(',').map(Number);
        activeCells.add(key);
        
        // Add all neighbors to check
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const neighborKey = getCellKey(row + i, col + j);
            activeCells.add(neighborKey);
          }
        }
      }

      // Check each cell that needs updating
      for (const key of activeCells) {
        const [row, col] = key.split(',').map(Number);
        let neighbors = 0;

        // Count neighbors
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const neighborKey = getCellKey(row + i, col + j);
            if (g.has(neighborKey)) neighbors++;
          }
        }

        // Apply Game of Life rules
        const isAlive = g.has(key);
        if (isAlive && (neighbors === 2 || neighbors === 3)) {
          newGrid.set(key, true);
        } else if (!isAlive && neighbors === 3) {
          newGrid.set(key, true);
        }
      }

      return newGrid;
    });

    setGeneration(g => g + 1);
    setGrid(currentGrid => {
      setPopulation(currentGrid.size);
      return currentGrid;
    });

    setTimeout(runSimulation, 100);
  }, []);

  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left click
      setIsDragging(false);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      setDragDistance(0);
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (dragStart.x === 0 && dragStart.y === 0) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    setDragDistance(distance);
    
    if (distance > 5) { // 5px threshold before considering it a drag
      setIsDragging(true);
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [dragStart, position]);

  const handleMouseUp = (e) => {
    // Only activate cell if we never started dragging
    if (!isDragging && dragDistance <= 5) {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      // Calculate relative position within the container
      const relativeX = e.clientX - containerRect.left - (containerWidth / 2) - position.x;
      const relativeY = e.clientY - containerRect.top - (containerHeight / 2) - position.y;
      
      // Calculate cell coordinates
      const col = Math.floor(relativeX / cellSize);
      const row = Math.floor(relativeY / cellSize);
      
      const wrappedRow = ((row % gridSize.rows) + gridSize.rows) % gridSize.rows;
      const wrappedCol = ((col % gridSize.cols) + gridSize.cols) % gridSize.cols;
      toggleCell(wrappedRow, wrappedCol);
    }
    
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragDistance(0);
  };

  const handleCellMouseDown = useCallback((row, col, e) => {
    // Only handle cell activation if we're not already dragging
    if (!isDragging && dragDistance <= 5) {
      const wrappedRow = ((row % gridSize.rows) + gridSize.rows) % gridSize.rows;
      const wrappedCol = ((col % gridSize.cols) + gridSize.cols) % gridSize.cols;
      toggleCell(wrappedRow, wrappedCol);
    }
  }, [isDragging, gridSize.rows, gridSize.cols, toggleCell, dragDistance]);

  const loadPattern = useCallback((patternName) => {
    if (!patternName) return;
    
    const pattern = PATTERNS[patternName].pattern;
    const newGrid = new Map();
    
    const startRow = Math.floor(-pattern.length / 2);
    const startCol = Math.floor(-pattern[0].length / 2);
    
    for (let i = 0; i < pattern.length; i++) {
      for (let j = 0; j < pattern[i].length; j++) {
        if (pattern[i][j] === 1) {
          newGrid.set(getCellKey(startRow + i, startCol + j), true);
        }
      }
    }
    
    setGrid(newGrid);
    setGeneration(0);
    setPopulation(newGrid.size);
  }, []);

  const getVisibleCells = useCallback(() => {
    if (!containerRef.current) return { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // Calculate cells needed to fill the container
    const colsNeeded = Math.ceil(containerWidth / cellSize) + 2;
    const rowsNeeded = Math.ceil(containerHeight / cellSize) + 2;
    
    // Calculate center position
    const centerX = -positionRef.current.x / cellSize;
    const centerY = -positionRef.current.y / cellSize;
    
    return {
      startRow: Math.floor(centerY - rowsNeeded/2),
      endRow: Math.ceil(centerY + rowsNeeded/2),
      startCol: Math.floor(centerX - colsNeeded/2),
      endCol: Math.ceil(centerX + colsNeeded/2)
    };
  }, [cellSize, positionRef]);
  const renderGrid = useCallback(() => {
    const { startRow, endRow, startCol, endCol } = getVisibleCells();
    const cells = [];
    
    if (!containerRef.current) return cells;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const key = getCellKey(row, col);
        const x = (col * cellSize) + positionRef.current.x + (containerWidth / 2);
        const y = (row * cellSize) + positionRef.current.y + (containerHeight / 2);

        cells.push(
          <div
            key={key}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: grid.has(key) ? '#06d6a0' : '#2a2a2a',
              border: '1px solid #333',
              cursor: isDragging ? 'grabbing' : 'pointer',
              position: 'absolute',
              left: x,
              top: y,
              willChange: 'transform',
              transform: 'translate3d(0,0,0)'
            }}
          />
        );
      }
    }
    return cells;
  }, [cellSize, grid, isDragging, getVisibleCells, positionRef.current]);

  // Center grid on mount and cell size change
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      setPosition({
        x: -(gridSize.cols * cellSize) / 2 + containerWidth / 2,
        y: -(gridSize.rows * cellSize) / 2 + containerHeight / 2
      });
    }
  }, [cellSize, gridSize.cols, gridSize.rows]);

  // Add mouse event listeners for drag handling
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mouseleave', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, []);

  // Modify pattern loading for infinite grid
  const advance23Generations = async () => {
    setIsRunning(false);
    for (let i = 0; i < 23; i++) {
      setGrid(g => {
        const nextGen = new Map();
        const activeCells = new Set();
        
        // Collect all active cells and their neighbors
        for (const [key] of g) {
          const [row, col] = key.split(',').map(Number);
          activeCells.add(key);
          
          // Add all neighbors to check
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const neighborKey = getCellKey(row + di, col + dj);
              activeCells.add(neighborKey);
            }
          }
        }

        // Check each cell that needs updating
        for (const key of activeCells) {
          const [row, col] = key.split(',').map(Number);
          let neighbors = 0;

          // Count neighbors
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              if (di === 0 && dj === 0) continue;
              const neighborKey = getCellKey(row + di, col + dj);
              if (g.has(neighborKey)) neighbors++;
            }
          }

          // Apply Game of Life rules
          const isAlive = g.has(key);
          if (isAlive && (neighbors === 2 || neighbors === 3)) {
            nextGen.set(key, true);
          } else if (!isAlive && neighbors === 3) {
            nextGen.set(key, true);
          }
        }

        return nextGen;
      });
      
      // Increment generation after grid update
      setGeneration(g => g + 1);
      
      // Update population after all updates
      setGrid(currentGrid => {
        const newPopulation = currentGrid.size;
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
      const nextGen = new Map();
      const activeCells = new Set();
      
      // Collect all active cells and their neighbors
      for (const [key] of g) {
        const [row, col] = key.split(',').map(Number);
        activeCells.add(key);
        
        // Add all neighbors to check
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const neighborKey = getCellKey(row + di, col + dj);
            activeCells.add(neighborKey);
          }
        }
      }

      // Check each cell that needs updating
      for (const key of activeCells) {
        const [row, col] = key.split(',').map(Number);
        let neighbors = 0;

        // Count neighbors
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const neighborKey = getCellKey(row + di, col + dj);
            if (g.has(neighborKey)) neighbors++;
          }
        }

        // Apply Game of Life rules
        const isAlive = g.has(key);
        if (isAlive && (neighbors === 2 || neighbors === 3)) {
          nextGen.set(key, true);
        } else if (!isAlive && neighbors === 3) {
          nextGen.set(key, true);
        }
      }

      return nextGen;
    });
    
    // Increment generation after grid update
    setGeneration(g => g + 1);
    
    // Update population after all updates
    setGrid(currentGrid => {
      const newPopulation = currentGrid.size;
      setPopulation(newPopulation);
      return currentGrid;
    });
  };

  const handleZoom = (zoomIn) => {
    setCellSize(prevSize => {
      const newSize = zoomIn ? 
        Math.min(prevSize + 5, MAX_CELL_SIZE) : 
        Math.max(prevSize - 5, MIN_CELL_SIZE);
      return newSize;
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

  const resetGrid = () => {
    setGrid(new Map());
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
        flex: 1
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
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              background: 'rgba(26, 26, 26, 0.5)',
              padding: '0.5rem',
              borderRadius: '8px'
            }}>
              <button
                onClick={() => handleZoom(false)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0aefff',
                  color: 'white',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                -
              </button>
              <button
                onClick={() => handleZoom(true)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0aefff',
                  color: 'white',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                +
              </button>
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
        </div>

        <div 
          ref={containerRef}
          style={{
            width: '100%',
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '1.5rem',
            background: '#1a1a1a'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}>
            {renderGrid()}
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