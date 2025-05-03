import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  startSession, 
  endSession, 
  saveGameState, 
  loadGameState 
} from '../services/gameservice'; // Update your import with the new functions

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

  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [grid, setGrid] = useState(() => new Map());
  const [position, setPosition] = useState(() => ({ x: 0, y: 0 }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  // Changed default to false - AutoSave disabled by default
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  // Add states for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const clickTimeoutRef = useRef(null);

  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const rafRef = useRef(null);
  // Session tracking refs
  const generationRef = useRef(generation);
  generationRef.current = generation;
  const populationRef = useRef(population);
  populationRef.current = population;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  // Message timeout ref
  const messageTimeoutRef = useRef(null);

  // Pre-calculate container dimensions
  const containerDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  }, []);

  // Memoize cell key generation
  const getCellKey = useCallback((row, col) => `${row},${col}`, []);

  // Memoize the cell style creation
  const getCellStyle = useCallback((x, y, isAlive, size, isDragging) => ({
    width: size,
    height: size,
    backgroundColor: isAlive ? '#06d6a0' : '#2a2a2a',
    border: '1px solid #333',
    cursor: isDragging ? 'grabbing' : 'pointer',
    position: 'absolute',
    left: x,
    top: y,
    willChange: 'transform',
    transform: 'translate3d(0,0,0)',
    pointerEvents: isDragging ? 'none' : 'auto'
  }), []);

  // Add a function to calculate pattern bounds (kept for potential future use, e.g., centering)
  /* // Comment out the unused function
  const getPatternBounds = useCallback(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [key] of gridRef.current) { // Use ref here to avoid dependency
      const [row, col] = key.split(',').map(Number);
      minX = Math.min(minX, col);
      maxX = Math.max(maxX, col);
      minY = Math.min(minY, row);
      maxY = Math.max(maxY, row);
    }
    return { minX, maxX, minY, maxY };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  */
  // Note: getPatternBounds is kept for potential future use (e.g., centering patterns)

  const getVisibleCells = useCallback(() => {
    const { width, height } = containerDimensions();
    if (!width || !height) return { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };

    // Calculate cells needed to fill the container plus some padding
    const colsNeeded = Math.ceil(width / cellSize) + 4;
    const rowsNeeded = Math.ceil(height / cellSize) + 4;

    // Calculate center position in cell coordinates using the ref for stability
    const currentPosition = positionRef.current;
    const centerX = -currentPosition.x / cellSize;
    const centerY = -currentPosition.y / cellSize;

    return {
      startRow: Math.floor(centerY - rowsNeeded/2),
      endRow: Math.ceil(centerY + rowsNeeded/2),
      startCol: Math.floor(centerX - colsNeeded/2),
      endCol: Math.ceil(centerX + colsNeeded/2)
    };
  }, [cellSize, containerDimensions]); // positionRef is stable, no need to include position state

  const toggleCell = useCallback((row, col) => {
    const key = getCellKey(row, col);
    setGrid(prevGrid => {
      const newGrid = new Map(prevGrid);
      if (newGrid.has(key)) {
        newGrid.delete(key);
      } else {
        newGrid.set(key, true);
      }
      // Update population immediately after toggling
      setPopulation(newGrid.size);
      return newGrid;
    });
  }, [getCellKey]);

  // Helper function to show temporary messages
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    
    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    
    // Set new timeout to clear the message after 5 seconds
    messageTimeoutRef.current = setTimeout(() => {
      setMessage(null);
      messageTimeoutRef.current = null;
    }, 5000);
  };

  const handleMouseDown = (e) => {
    // Clear any pending click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    if (e.button === 1 || e.button === 2) { // Middle click or right click for panning
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY
      });
      e.preventDefault(); // Prevent context menu on right click
      document.body.style.cursor = 'grabbing';
    } else if (e.button === 0) { // Left click for cell interaction
      setIsDragging(false);
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
      setDragDistance(0);

      // Calculate cell position immediately
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const relativeX = e.clientX - containerRect.left - (containerWidth / 2);
      const relativeY = e.clientY - containerRect.top - (containerHeight / 2);

      const col = Math.floor((relativeX - position.x) / cellSize);
      const row = Math.floor((relativeY - position.y) / cellSize);

      // Store the cell coordinates for potential activation
      const pendingCell = { row, col };

      // Add a very short delay (50ms) to check if this is a pan or a click
      clickTimeoutRef.current = setTimeout(() => {
        if (!isPanning && !isDragging) {
          toggleCell(pendingCell.row, pendingCell.col);
        }
      }, 50);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUpGlobal, { once: true });
  };

  const handleMouseMove = useCallback(
    throttle((e) => {
      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPosition({ x: dx, y: dy });
        positionRef.current = { x: dx, y: dy };
        setGrid(prev => new Map(prev));
      } else if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        const distance = Math.sqrt(
          Math.pow(newX - position.x, 2) + 
          Math.pow(newY - position.y, 2)
        );

        // Increase drag distance threshold to 10 pixels
        if (distance > 10) {
          setIsDragging(true);
          // If we start dragging, cancel any pending cell activation
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }
        }

        if (isDragging) {
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
          rafRef.current = requestAnimationFrame(() => {
            positionRef.current = { x: newX, y: newY };
            setGrid(prev => new Map(prev));
            rafRef.current = null;
          });
        }
        setDragDistance(distance);
      }
    }, 16), [isPanning, isDragging, dragStart, panStart]);

  const handleMouseUpGlobal = useCallback((e) => {
    window.removeEventListener('mousemove', handleMouseMove);
    
    if (isPanning) {
      setIsPanning(false);
      setPanStart({ x: 0, y: 0 });
      document.body.style.cursor = 'default';
    } else {
      setIsDragging(false);
      setDragStart({ x: 0, y: 0 });
      setDragDistance(0);
    }

    // Clear any pending click timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
  }, [isPanning, isDragging, handleMouseMove]);

  const loadPattern = useCallback((patternName) => {
    if (!patternName || !containerRef.current) return;

    const patternData = PATTERNS[patternName];
    if (!patternData) return;

    const pattern = patternData.pattern;
    const newGrid = new Map();

    // Calculate pattern dimensions
    const patternHeight = pattern.length;
    const patternWidth = pattern[0].length;

    // Calculate center offset for the pattern
    const startRow = -Math.floor(patternHeight / 2);
    const startCol = -Math.floor(patternWidth / 2);

    // Place pattern relative to (0,0)
    for (let i = 0; i < patternHeight; i++) {
      for (let j = 0; j < patternWidth; j++) {
        if (pattern[i][j] === 1) {
          newGrid.set(getCellKey(startRow + i, startCol + j), true);
        }
      }
    }

    setGrid(newGrid);
    setGeneration(0);
    setPopulation(newGrid.size);

    // Center the view on the pattern's approximate center (0,0 in grid coordinates)
    positionRef.current = { x: 0, y: 0 };
    setGrid(prev => new Map(prev));
  }, [getCellKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const renderGrid = useCallback(() => {
    const { startRow, endRow, startCol, endCol } = getVisibleCells();
    const cells = [];

    if (!containerRef.current) return cells;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    // Calculate visible area with padding
    const padding = 5; // Add some padding cells
    const visibleStartRow = startRow - padding;
    const visibleEndRow = endRow + padding;
    const visibleStartCol = startCol - padding;
    const visibleEndCol = endCol + padding;

    // Pre-calculate common values using refs for stability
    const halfContainerWidth = containerWidth / 2;
    const halfContainerHeight = containerHeight / 2;
    const currentPosition = positionRef.current;
    const currentGrid = gridRef.current;
    const currentCellSize = cellSize; // Capture cellSize for this render pass

    for (let row = visibleStartRow; row < visibleEndRow; row++) {
      for (let col = visibleStartCol; col < visibleEndCol; col++) {
        const key = getCellKey(row, col);
        const x = (col * currentCellSize) + currentPosition.x + halfContainerWidth;
        const y = (row * currentCellSize) + currentPosition.y + halfContainerHeight;

        // Skip cells that would be outside the viewport
        if (x < -currentCellSize || x > containerWidth + currentCellSize ||
            y < -currentCellSize || y > containerHeight + currentCellSize) {
          continue;
        }

        cells.push(
          <div
            key={key}
            // Intentionally not adding onClick here to avoid performance issues with many cells
            // Click handling is done on the container
            style={getCellStyle(x, y, currentGrid.has(key), currentCellSize, isDragging)}
          />
        );
      }
    }
    return cells;
  }, [cellSize, isDragging, getVisibleCells, getCellStyle, getCellKey]); // Dependencies are correct

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

      // Update population state after calculating the new grid
      setPopulation(newGrid.size);
      return newGrid;
    });

    setGeneration(g => g + 1);

    // Use setTimeout for the next step
    setTimeout(runSimulation, 100);
  }, [getCellKey]); // Removed setPopulation from here as it's handled within setGrid

  // Center grid view initially & Start Session
  useEffect(() => {
    // Center view
    if (containerRef.current) {
      setPosition({
        x: 0, // Start at (0,0) in grid coordinates for a cleaner initial view
        y: 0
      });
    }

    // Start game session if user is logged in
    if (user?.id) {
      console.log("Attempting to start session for user:", user.id);
      startSession().then(response => {
        if (response.success && response.sessionId) {
          console.log("Session started successfully, ID:", response.sessionId);
          setSessionId(response.sessionId);
        } else {
          console.error("Failed to start session:", response.error);
          showMessage("Failed to start session: " + (response.error || "Unknown error"), "error");
        }
      }).catch(error => {
         console.error("Error calling startSession:", error);
         showMessage("Network error starting session", "error");
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Run only when user ID changes (effectively on mount for a logged-in user)

  // End Session on Unmount
  useEffect(() => {
    // Return a cleanup function that will be called when the component unmounts
    return () => {
      // Use the ref here to get the latest sessionId
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId && user?.id) {
        console.log(`Ending session ${currentSessionId} on unmount.`);
        // Use refs for generation and population to get the latest values
        endSession(currentSessionId, generationRef.current, populationRef.current)
          .then(response => {
            if (response.success) {
              console.log(`Session ${currentSessionId} ended successfully.`);
            } else {
              console.error(`Failed to end session ${currentSessionId}:`, response.error);
            }
          }).catch(error => {
             console.error(`Error calling endSession for ${currentSessionId}:`, error);
          });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Depend only on user.id to set up/tear down the effect correctly

  const handleZoom = useCallback((zoomIn) => {
    setCellSize(prevSize => {
      const newSize = zoomIn ?
        Math.min(prevSize + 5, MAX_CELL_SIZE) :
        Math.max(prevSize - 5, MIN_CELL_SIZE);

      if (newSize === prevSize) return prevSize; // No change

      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        // Calculate the grid coordinate at the center of the viewport BEFORE zoom
        const viewCenterX = (containerWidth / 2 - position.x) / prevSize;
        const viewCenterY = (containerHeight / 2 - position.y) / prevSize;

        // Calculate the new position to keep the same grid coordinate at the center AFTER zoom
        const newX = containerWidth / 2 - viewCenterX * newSize;
        const newY = containerHeight / 2 - viewCenterY * newSize;

        setPosition({ x: newX, y: newY });
      }

      return newSize;
    });
  }, []); // Removed dependencies as refs are used and setPosition updates positionRef

  const resetGrid = () => {
    setGrid(new Map());
    setGeneration(0);
    setIsRunning(false);
    setPopulation(0);
    // Reset position to (0,0) in grid coordinates
    if (containerRef.current) {
      setPosition({ x: 0, y: 0 });
    }
    setCellSize(DEFAULT_CELL_SIZE);
  };

  const handleNextGeneration = useCallback(() => {
    // This function essentially performs one step of runSimulation
    setGrid(g => {
      const newGrid = new Map();
      const activeCells = new Set();
      for (const [key] of g) {
        const [row, col] = key.split(',').map(Number);
        activeCells.add(key);
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            activeCells.add(getCellKey(row + i, col + j));
          }
        }
      }
      for (const key of activeCells) {
        const [row, col] = key.split(',').map(Number);
        let neighbors = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            if (g.has(getCellKey(row + i, col + j))) neighbors++;
          }
        }
        const isAlive = g.has(key);
        if ((isAlive && (neighbors === 2 || neighbors === 3)) || (!isAlive && neighbors === 3)) {
          newGrid.set(key, true);
        }
      }
      setPopulation(newGrid.size); // Update population
      return newGrid;
    });
    setGeneration(g => g + 1);
  }, [getCellKey]); // Removed setPopulation dependency

  const advance23Generations = useCallback(() => {
    const wasRunning = runningRef.current; // Use ref
    if (wasRunning) {
      setIsRunning(false); // This will update runningRef.current via its useEffect
    }

    let currentStep = 0;
    const stepInterval = 60;

    const advanceStep = () => {
      if (currentStep < 23) {
        handleNextGeneration();
        currentStep++;
        setTimeout(advanceStep, stepInterval);
      } else {
        if (wasRunning) {
          setIsRunning(true); // This will update runningRef.current and trigger runSimulation
        }
      }
    };

    advanceStep();
  }, [handleNextGeneration]); // Removed isRunning and runSimulation dependencies

  // Save state to server
  const handleSaveState = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      // Convert grid Map to array for easier storage
      const gridArray = Array.from(grid.keys());
      
      // Create state object with all necessary data
      const gameState = {
        grid: gridArray,
        position,
        cellSize
      };
      
      const response = await saveGameState(gameState, generation, population);
      
      if (response.success) {
        showMessage('Game state saved successfully!', 'success');
      } else {
        showMessage('Failed to save: ' + (response.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error saving game state:', error);
      showMessage('Error saving game state', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load state from server
  const handleLoadState = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await loadGameState();
      
      if (response.success && response.state) {
        // Parse the saved state
        const savedState = JSON.parse(response.state);
        
        // Restore grid
        const restoredGrid = new Map();
        savedState.grid.forEach(key => restoredGrid.set(key, true));
        
        // Restore all state
        setGrid(restoredGrid);
        setPosition(savedState.position);
        setCellSize(savedState.cellSize);
        setGeneration(response.generations || 0);
        setPopulation(restoredGrid.size);
        
        showMessage('Game state loaded successfully!', 'success');
      } else {
        showMessage(response.message || 'No saved state found.', 'info');
      }
    } catch (error) {
      console.error('Error loading game state:', error);
      showMessage('Error loading game state', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // REMOVED the localStorage auto-load effect since we want to start with an empty board

  // Server auto-save effect (only if enabled)
  useEffect(() => {
    if (!autoSaveEnabled || !user?.id || grid.size === 0) return;
    
    // Use debounce to avoid excessive calls to the server
    const handler = setTimeout(() => {
      // Convert grid Map to array for easier storage
      const gridArray = Array.from(grid.keys());
      
      // Create state object with necessary data
      const gameState = {
        grid: gridArray,
        position,
        cellSize
      };
      
      // Call the server-side save function
      saveGameState(gameState, generation, population)
        .then(response => {
          if (!response.success) {
            console.error('Auto-save failed:', response.error);
          }
        })
        .catch(error => {
          console.error('Auto-save error:', error);
        });
    }, 2000); // Longer debounce (2 seconds) for server calls
    
    return () => clearTimeout(handler);
  }, [grid, generation, position, cellSize, user?.id, autoSaveEnabled, population]);

  // Effect to start/stop simulation when isRunning changes
  useEffect(() => {
    if (isRunning) {
      runningRef.current = true;
      runSimulation();
    } else {
      runningRef.current = false;
      // No need to explicitly stop timeout here, runSimulation checks runningRef.current
    }
  }, [isRunning, runSimulation]);

  if (!user) {
    navigate('/login');
    return null; // Render nothing while redirecting
  }

  // Modified handleLogout to end session
  const handleLogout = async () => {
    // End the current session before logging out
    if (sessionId && user?.id) {
      console.log(`Ending session ${sessionId} on logout.`);
      try {
        const response = await endSession(sessionId, generation, population);
        if (response.success) {
          console.log(`Session ${sessionId} ended successfully before logout.`);
        } else {
          console.error(`Failed to end session ${sessionId} before logout:`, response.error);
        }
      } catch (error) {
         console.error(`Error calling endSession for ${sessionId} during logout:`, error);
      }
    }

    // Proceed with logout
    localStorage.removeItem('user');
    setSessionId(null);
    navigate('/login');
  };

  // Define a base button style to avoid repetition
  const controlButtonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    minWidth: '100px',
  };

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #073b4c 0%, #061a40 100%)',
      padding: '0.75rem',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Main container */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        {/* Header: Stats and Logout */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexShrink: 0,
          gap: '1rem'
        }}>
          {/* Stats Box */}
          <div style={{
            background: 'rgba(26, 26, 26, 0.6)',
            padding: '0.75rem 1.25rem',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '1.5rem'
          }}>
            {/* Generation */}
            <div style={{ textAlign: 'center' }}>
              <span style={{
                color: '#90e0ef',
                fontSize: '0.8rem',
                fontWeight: '500',
                display: 'block',
                marginBottom: '0.1rem'
              }}>Generation</span>
              <span style={{
                color: '#06d6a0',
                fontSize: '1.2rem',
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>{generation}</span>
            </div>
            {/* Population */}
            <div style={{ textAlign: 'center' }}>
              <span style={{
                color: '#90e0ef',
                fontSize: '0.8rem',
                fontWeight: '500',
                display: 'block',
                marginBottom: '0.1rem'
              }}>Population</span>
              <span style={{
                color: '#06d6a0',
                fontSize: '1.2rem',
                fontWeight: '600',
                fontFamily: 'monospace'
              }}>{population}</span>
            </div>
          </div>
          
          {/* Message display */}
          {message && (
            <div style={{
              background: message.type === 'error' ? 'rgba(255, 104, 107, 0.2)' : 
                          message.type === 'info' ? 'rgba(10, 239, 255, 0.2)' : 
                          'rgba(6, 214, 160, 0.2)',
              color: message.type === 'error' ? '#ff686b' : 
                     message.type === 'info' ? '#0aefff' : 
                     '#06d6a0',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              flex: 1,
              textAlign: 'center',
              maxWidth: '400px'
            }}>
              {message.text}
            </div>
          )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              ...controlButtonStyle,
              background: '#ff686b',
              padding: '0.6rem 1.2rem',
              alignSelf: 'center'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#e05558'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#ff686b'}
          >
            Logout
          </button>
        </div>

        {/* Game Grid Container */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onContextMenu={(e) => e.preventDefault()} // Prevent context menu
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            cursor: isPanning ? 'grabbing' : 'default'
          }}
        >
          {/* Rendered Grid Cells */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
          }}>
            {renderGrid()}
          </div>
        </div>

        {/* Controls Bar */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '0.75rem',
          background: 'rgba(26, 26, 26, 0.6)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          flexShrink: 0
        }}>
          {/* Zoom Buttons */}
          <button
            onClick={() => handleZoom(false)}
            style={{
              ...controlButtonStyle,
              background: '#0aefff',
              color: '#073b4c',
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              minWidth: 'auto'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#00dcec'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0aefff'}
          >
            -
          </button>
          <button
            onClick={() => handleZoom(true)}
            style={{
              ...controlButtonStyle,
              background: '#0aefff',
              color: '#073b4c',
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              minWidth: 'auto'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#00dcec'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#0aefff'}
          >
            +
          </button>

          {/* Start/Stop Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              ...controlButtonStyle,
              background: isRunning ? '#ff686b' : '#06d6a0',
              minWidth: '100px'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = isRunning ? '#e05558' : '#05b387'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = isRunning ? '#ff686b' : '#06d6a0'}
          >
            {isRunning ? 'Stop' : 'Start'}
          </button>

          {/* Next Generation Button */}
          <button
            onClick={handleNextGeneration}
            disabled={isRunning}
            style={{
              ...controlButtonStyle,
              background: '#0aefff',
              color: '#073b4c',
              minWidth: '100px',
              opacity: isRunning ? 0.5 : 1,
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={e => !isRunning && (e.currentTarget.style.backgroundColor = '#00dcec')}
            onMouseOut={e => !isRunning && (e.currentTarget.style.backgroundColor = '#0aefff')}
          >
            Next Gen
          </button>

          {/* +23 Generations Button */}
          <button
            onClick={advance23Generations}
            disabled={isRunning}
            style={{
              ...controlButtonStyle,
              background: '#0aefff',
              color: '#073b4c',
              minWidth: '100px',
              opacity: isRunning ? 0.5 : 1,
              cursor: isRunning ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={e => !isRunning && (e.currentTarget.style.backgroundColor = '#00dcec')}
            onMouseOut={e => !isRunning && (e.currentTarget.style.backgroundColor = '#0aefff')}
          >
            +23 Gens
          </button>

          {/* Reset Button */}
          <button
            onClick={resetGrid}
            style={{
              ...controlButtonStyle,
              background: '#ff686b',
              minWidth: '100px'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#e05558'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = '#ff686b'}
          >
            Reset
          </button>

          {/* Auto-Save Toggle Button - Default to OFF */}
          <button
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            style={{
              ...controlButtonStyle,
              background: autoSaveEnabled ? '#06d6a0' : '#ff686b',
              minWidth: '120px'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = autoSaveEnabled ? '#05b387' : '#e05558'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = autoSaveEnabled ? '#06d6a0' : '#ff686b'}
          >
            {autoSaveEnabled ? 'AutoSave: ON' : 'AutoSave: OFF'}
          </button>

          {/* Server Save Button */}
          <button
            onClick={handleSaveState}
            disabled={isLoading}
            style={{
              ...controlButtonStyle,
              background: '#0aefff',
              color: '#073b4c',
              minWidth: '100px',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'wait' : 'pointer'
            }}
            onMouseOver={e => !isLoading && (e.currentTarget.style.backgroundColor = '#00dcec')}
            onMouseOut={e => !isLoading && (e.currentTarget.style.backgroundColor = '#0aefff')}
          >
            {isLoading ? 'Saving...' : 'Save Game'}
          </button>

          {/* Server Load Button */}
          <button
            onClick={handleLoadState}
            disabled={isLoading}
            style={{
              ...controlButtonStyle,
              background: '#f9c74f',
              color: '#073b4c',
              minWidth: '100px',
              opacity: isLoading ? 0.7 : 1, 
              cursor: isLoading ? 'wait' : 'pointer'
            }}
            onMouseOver={e => !isLoading && (e.currentTarget.style.backgroundColor = '#f3b529')}
            onMouseOut={e => !isLoading && (e.currentTarget.style.backgroundColor = '#f9c74f')}
          >
            {isLoading ? 'Loading...' : 'Load Last Game'}
          </button>

          {/* Pattern Selector */}
          <select
            onChange={(e) => loadPattern(e.target.value)}
            defaultValue=""
            style={{
              ...controlButtonStyle,
              background: '#2a2a2a',
              color: 'white',
              padding: '0.5rem 1rem',
              minWidth: '150px',
              height: '36px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.7rem top 50%',
              backgroundSize: '0.65rem auto',
              paddingRight: '2.5rem'
            }}
          >
            <option value="" disabled>Select Pattern</option>
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