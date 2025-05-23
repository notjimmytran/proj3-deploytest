import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startSession,
  endSession,
  saveGameState,
  loadGameState
} from '../services/gameservice';

import {
  savePattern,
  listPatterns,
  getPattern,
  deletePattern
} from '../services/patternservice';

// Throttle utility to limit function execution rate (for drag events)
const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
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

// Predefined Conway's Game of Life patterns
const PATTERNS = {
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
  glider: {
    name: 'Glider',
    pattern: [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1]
    ]
  },
  boat: {
    name: 'Boat',
    pattern: [
      [1, 1, 0],
      [1, 0, 1],
      [0, 1, 0]
    ]
  },
  loaf: {
    name: 'Loaf',
    pattern: [
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [0, 1, 0, 1],
      [0, 0, 1, 0]
    ]
  },
  toad: {
    name: 'Toad',
    pattern: [
      [0, 1, 1, 1],
      [1, 1, 1, 0]
    ]
  },
  pulsar: {
    name: 'Pulsar',
    pattern: [
      [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
      [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0]
    ]
  },
  gosper_glider_gun: {
    name: 'Gosper Glider Gun',
    pattern: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
  }
};

export default function Game() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const containerRef = useRef(null);

  // State variables for grid, UI, and session management
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [grid, setGrid] = useState(() => new Map());
  const [position, setPosition] = useState(() => ({ x: 0, y: 0 }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  const clickTimeoutRef = useRef(null);

  // Pattern management states
  const [savedPatterns, setSavedPatterns] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [showPatternMenu, setShowPatternMenu] = useState(false);
  const [isSavingPattern, setIsSavingPattern] = useState(false);
  const [isLoadingPattern, setIsLoadingPattern] = useState(false);
  const [isLoadingPatternList, setIsLoadingPatternList] = useState(false);

  // Refs for keeping latest state in async callbacks
  const runningRef = useRef(isRunning);
  runningRef.current = isRunning;
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const rafRef = useRef(null);
  const generationRef = useRef(generation);
  generationRef.current = generation;
  const populationRef = useRef(population);
  populationRef.current = population;
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const messageTimeoutRef = useRef(null);

  const [menuPosition, setMenuPosition] = useState({ top: 60, left: window.innerWidth - 350 });
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });
  
  const startDrag = (e) => {
    e.preventDefault();
    setDragging(true);
    setRel({
      x: e.clientX - menuPosition.left,
      y: e.clientY - menuPosition.top
    });
  };
  
  const onDrag = (e) => {
    if (!dragging) return;
    setMenuPosition({
      top: e.clientY - rel.y,
      left: e.clientX - rel.x
    });
  };
  
  const stopDrag = () => {
    setDragging(false);
  };
  
  useEffect(() => {
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
    return () => {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [dragging, rel]);
  

  // Get container dimensions for rendering visible grid
  const containerDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 0, height: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  }, []);

  // Generate a unique key for each cell
  const getCellKey = useCallback((row, col) => `${row},${col}`, []);

  // Style for each cell, memoized for performance
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

  // Calculate which cells are visible in the viewport
  const getVisibleCells = useCallback(() => {
    const { width, height } = containerDimensions();
    if (!width || !height) return { startRow: 0, endRow: 0, startCol: 0, endCol: 0 };

    const colsNeeded = Math.ceil(width / cellSize) + 4;
    const rowsNeeded = Math.ceil(height / cellSize) + 4;

    const currentPosition = positionRef.current;
    const centerX = -currentPosition.x / cellSize;
    const centerY = -currentPosition.y / cellSize;

    return {
      startRow: Math.floor(centerY - rowsNeeded / 2),
      endRow: Math.ceil(centerY + rowsNeeded / 2),
      startCol: Math.floor(centerX - colsNeeded / 2),
      endCol: Math.ceil(centerX + colsNeeded / 2)
    };
  }, [cellSize, containerDimensions]);

  // Toggle cell alive/dead state
  const toggleCell = useCallback((row, col) => {
    const key = getCellKey(row, col);
    setGrid(prevGrid => {
      const newGrid = new Map(prevGrid);
      if (newGrid.has(key)) {
        newGrid.delete(key);
      } else {
        newGrid.set(key, true);
      }
      setPopulation(newGrid.size);
      return newGrid;
    });
  }, [getCellKey]);

  // Show a temporary message to the user
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
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
      }
    }, 16), [isPanning, isDragging, dragStart, panStart]);

  // Mouse up handler: finish drag or toggle cell
  const handleMouseUpGlobal = useCallback((e) => {
    window.removeEventListener('mousemove', handleMouseMove);
    if (!isDragging && dragDistance <= 5) {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      const relativeX = e.clientX - containerRect.left - (containerWidth / 2);
      const relativeY = e.clientY - containerRect.top - (containerHeight / 2);
      const col = Math.floor((relativeX - positionRef.current.x) / cellSize);
      const row = Math.floor((relativeY - positionRef.current.y) / cellSize);
      toggleCell(row, col);
    }
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
    setDragDistance(0);
  }, [isDragging, dragDistance, cellSize, toggleCell, handleMouseMove]);

  // Load a predefined pattern into the grid
  const loadPattern = useCallback((patternName) => {
    if (!patternName || !containerRef.current) return;
    const patternData = PATTERNS[patternName];
    if (!patternData) return;
    const pattern = patternData.pattern;
    const newGrid = new Map();
    const patternHeight = pattern.length;
    const patternWidth = pattern[0].length;
    const startRow = -Math.floor(patternHeight / 2);
    const startCol = -Math.floor(patternWidth / 2);
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
    setPosition({
      x: 0,
      y: 0
    });
  }, [getCellKey]);

  // Load user's saved patterns from backend
  const loadSavedPatterns = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingPatternList(true);
    try {
      const response = await listPatterns();
      if (response.success) {
        setSavedPatterns(response.patterns);
      } else {
        showMessage(response.error || 'Failed to load saved patterns', 'error');
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
      showMessage('Error loading patterns', 'error');
    } finally {
      setIsLoadingPatternList(false);
    }
  }, [user?.id]);

  // Load patterns when user logs in
  useEffect(() => {
    if (user?.id) {
      loadSavedPatterns();
    }
  }, [user?.id, loadSavedPatterns]);

  // Save current grid as a pattern
  const handleSavePattern = async () => {
    if (!user?.id || !patternName.trim()) return;
    setIsSavingPattern(true);
    try {
      const gridArray = Array.from(grid.keys());
      const response = await savePattern(patternName.trim(), gridArray);
      if (response.success) {
        showMessage(response.message || 'Pattern saved successfully!');
        setPatternName('');
        setShowSaveModal(false);
        loadSavedPatterns();
      } else {
        showMessage(response.error || 'Failed to save pattern', 'error');
      }
    } catch (error) {
      console.error('Error saving pattern:', error);
      showMessage('Error saving pattern', 'error');
    } finally {
      setIsSavingPattern(false);
    }
  };

  // Load a saved pattern into the grid
  const handleLoadPattern = async (patternId) => {
    setIsLoadingPattern(true);
    try {
      const response = await getPattern(patternId);
      if (response.success) {
        const patternGrid = new Map();
        response.pattern.pattern_data.forEach(key => patternGrid.set(key, true));
        setGrid(patternGrid);
        setGeneration(0);
        setPopulation(patternGrid.size);
        showMessage(`Pattern "${response.pattern.name}" loaded successfully!`);
        setShowPatternMenu(false);
      } else {
        showMessage(response.error || 'Failed to load pattern', 'error');
      }
    } catch (error) {
      console.error('Error loading pattern:', error);
      showMessage('Error loading pattern', 'error');
    } finally {
      setIsLoadingPattern(false);
    }
  };

  // Delete a saved pattern
  const handleDeletePattern = async (patternId, event) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this pattern?')) return;
    try {
      const response = await deletePattern(patternId);
      if (response.success) {
        showMessage(response.message || 'Pattern deleted successfully!');
        loadSavedPatterns();
      } else {
        showMessage(response.error || 'Failed to delete pattern', 'error');
      }
    } catch (error) {
      console.error('Error deleting pattern:', error);
      showMessage('Error deleting pattern', 'error');
    }
  };

  // Close pattern menu when clicking outside
  useEffect(() => {
    if (!showPatternMenu) return;
    const handleClickOutside = (event) => {
      const menu = document.getElementById('pattern-menu');
      const button = document.getElementById('pattern-menu-button');
      if (
        menu &&
        !menu.contains(event.target) &&
        button &&
        !button.contains(event.target)
      ) {
        setShowPatternMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPatternMenu]);

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

  // Render only visible cells in the viewport
  const renderGrid = useCallback(() => {
    const { startRow, endRow, startCol, endCol } = getVisibleCells();
    const cells = [];
    if (!containerRef.current) return cells;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const padding = 5;
    const visibleStartRow = startRow - padding;
    const visibleEndRow = endRow + padding;
    const visibleStartCol = startCol - padding;
    const visibleEndCol = endCol + padding;
    const halfContainerWidth = containerWidth / 2;
    const halfContainerHeight = containerHeight / 2;
    const currentPosition = positionRef.current;
    const currentGrid = gridRef.current;
    const currentCellSize = cellSize;
    for (let row = visibleStartRow; row < visibleEndRow; row++) {
      for (let col = visibleStartCol; col < visibleEndCol; col++) {
        const key = getCellKey(row, col);
        const x = (col * currentCellSize) + currentPosition.x + halfContainerWidth;
        const y = (row * currentCellSize) + currentPosition.y + halfContainerHeight;
        if (x < -currentCellSize || x > containerWidth + currentCellSize ||
          y < -currentCellSize || y > containerHeight + currentCellSize) {
          continue;
        }
        cells.push(
          <div
            key={key}
            style={getCellStyle(x, y, currentGrid.has(key), currentCellSize, isDragging)}
          />
        );
      }
    }
    return cells;
  }, [cellSize, isDragging, getVisibleCells, getCellStyle, getCellKey]);

  // Cleanup animation frame and message timeout on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;
    setGrid(g => {
      const newGrid = new Map();
      const activeCells = new Set();
      // Find all cells that need to be checked (alive and their neighbors)
      for (const [key] of g) {
        const [row, col] = key.split(',').map(Number);
        activeCells.add(key);
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const neighborKey = getCellKey(row + i, col + j);
            activeCells.add(neighborKey);
          }
        }
      }
      // Apply Game of Life rules
      for (const key of activeCells) {
        const [row, col] = key.split(',').map(Number);
        let neighbors = 0;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const neighborKey = getCellKey(row + i, col + j);
            if (g.has(neighborKey)) neighbors++;
          }
        }
        const isAlive = g.has(key);
        if (isAlive && (neighbors === 2 || neighbors === 3)) {
          newGrid.set(key, true);
        } else if (!isAlive && neighbors === 3) {
          newGrid.set(key, true);
        }
      }
      setPopulation(newGrid.size);
      return newGrid;
    });
    setGeneration(g => g + 1);
    setTimeout(runSimulation, 100);
  }, [getCellKey]);

  useEffect(() => {
    if (containerRef.current) {
      setPosition({
        x: 0,
        y: 0
      });
    }
    if (user?.id) {
      startSession().then(response => {
        if (response.success && response.sessionId) {
          setSessionId(response.sessionId);
        } else {
          showMessage("Failed to start session: " + (response.error || "Unknown error"), "error");
        }
      }).catch(error => {
        showMessage("Network error starting session", "error");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // On unmount: end session and save stats
  useEffect(() => {
    return () => {
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId && user?.id) {
        endSession(currentSessionId, generationRef.current, populationRef.current)
          .then(response => {
            // Optionally handle response
          }).catch(error => {
            // Optionally handle error
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Zoom in/out and keep grid centered
  const handleZoom = useCallback((zoomIn) => {
    setCellSize(prevSize => {
      const newSize = zoomIn ?
        Math.min(prevSize + 5, MAX_CELL_SIZE) :
        Math.max(prevSize - 5, MIN_CELL_SIZE);
      if (newSize === prevSize) return prevSize;
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
  }, []);

  // Reset the grid and UI to initial state
  const resetGrid = () => {
    setGrid(new Map());
    setGeneration(0);
    setIsRunning(false);
    setPopulation(0);
    if (containerRef.current) {
      setPosition({ x: 0, y: 0 });
    }
    setCellSize(DEFAULT_CELL_SIZE);
  };

  // Advance the simulation by one generation
  const handleNextGeneration = useCallback(() => {
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
      setPopulation(newGrid.size);
      return newGrid;
    });
    setGeneration(g => g + 1);
  }, [getCellKey]);

  // Advance the simulation by 23 generations (for fun)
  const advance23Generations = useCallback(() => {
    const wasRunning = runningRef.current;
    if (wasRunning) {
      setIsRunning(false);
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
          setIsRunning(true);
        }
      }
    };
    advanceStep();
  }, [handleNextGeneration]);

  // Save current game state to backend
  const handleSaveState = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const gridArray = Array.from(grid.keys());
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

  // Load last saved game state from backend
  const handleLoadState = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await loadGameState();
      if (response.success && response.state) {
        const savedState = JSON.parse(response.state);
        const restoredGrid = new Map();
        savedState.grid.forEach(key => restoredGrid.set(key, true));
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

  // Auto-save game state when enabled and grid changes
  useEffect(() => {
    if (!autoSaveEnabled || !user?.id || grid.size === 0) return;
    const handler = setTimeout(() => {
      const gridArray = Array.from(grid.keys());
      const gameState = {
        grid: gridArray,
        position,
        cellSize
      };
      saveGameState(gameState, generation, population)
        .then(response => {
          if (!response.success) {
            console.error('Auto-save failed:', response.error);
          }
        })
        .catch(error => {
          console.error('Auto-save error:', error);
        });
    }, 2000);
    return () => clearTimeout(handler);
  }, [grid, generation, position, cellSize, user?.id, autoSaveEnabled, population]);

  // Start/stop simulation loop when isRunning changes
  useEffect(() => {
    if (isRunning) {
      runningRef.current = true;
      runSimulation();
    } else {
      runningRef.current = false;
    }
  }, [isRunning, runSimulation]);

  // Redirect to login if user is not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  // Logout handler: end session and clear user data
  const handleLogout = async () => {
    if (sessionId && user?.id) {
      try {
        await endSession(sessionId, generation, population);
      } catch (error) { }
    }
    localStorage.removeItem('user');
    setSessionId(null);
    navigate('/login');
  };

  // Button style for controls
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

  // --- JSX rendering below ---
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
        {/* Top bar: stats, message, logout */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.75rem',
          flexShrink: 0,
          gap: '1rem'
        }}>
          {/* Generation and population stats */}
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
          {/* Dashboard Page */}
          <button
          onClick={() => navigate('/dashboard')}
          style={{
            ...controlButtonStyle,
            background: '#06d6a0',
            color: '#073b4c',
            padding: '0.6rem 1.2rem',
            minWidth: 'auto'
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#05b387'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#06d6a0'}
        >
          Dashboard
        </button>
          {/* Logout button */}
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
        {/* Main grid area */}
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
        {/* Controls bar */}
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
          {/* Zoom out button */}
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
          {/* Zoom in button */}
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
          {/* Start/Stop simulation */}
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
          {/* Next generation button */}
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
          {/* Advance 23 generations */}
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
          {/* Reset grid */}
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
          {/* Toggle auto-save */}
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
          {/* Save game state */}
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
          {/* Load last saved game state */}
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
          {/* Predefined pattern selector */}
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
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")',
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
              <option value="boat">Boat</option>
              <option value="loaf">Loaf</option>
            </optgroup>
            <optgroup label="Oscillators">
              <option value="blinker">Blinker</option>
              <option value="beacon">Beacon</option>
              <option value="toad">Toad</option>
              <option value="pulsar">Pulsar</option>
            </optgroup>
            <optgroup label="Spaceships">
              <option value="glider">Glider</option>
            </optgroup>
            <optgroup label="Guns (Bonus)">
              <option value="gosper_glider_gun">Gosper Glider Gun</option>
            </optgroup>
          </select>
          {/* Save current pattern button */}
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={isSavingPattern || grid.size === 0}
            style={{
              ...controlButtonStyle,
              background: '#f9c74f',
              color: '#073b4c',
              minWidth: '130px',
              opacity: (isSavingPattern || grid.size === 0) ? 0.5 : 1,
              cursor: (isSavingPattern || grid.size === 0) ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={e => !(isSavingPattern || grid.size === 0) && (e.currentTarget.style.backgroundColor = '#f3b529')}
            onMouseOut={e => !(isSavingPattern || grid.size === 0) && (e.currentTarget.style.backgroundColor = '#f9c74f')}
          >
            Save Pattern
          </button>
          {/* Show user's saved patterns */}
          <button
            id="pattern-menu-button"
            onClick={() => {
              setShowPatternMenu(!showPatternMenu);
              if (!showPatternMenu) loadSavedPatterns();
            }}
            disabled={isLoadingPatternList}
            style={{
              ...controlButtonStyle,
              background: '#0aefff',
              color: '#073b4c',
              minWidth: '140px',
              opacity: isLoadingPatternList ? 0.5 : 1,
              cursor: isLoadingPatternList ? 'not-allowed' : 'pointer'
            }}
            onMouseOver={e => !isLoadingPatternList && (e.currentTarget.style.backgroundColor = '#00dcec')}
            onMouseOut={e => !isLoadingPatternList && (e.currentTarget.style.backgroundColor = '#0aefff')}
          >
            My Patterns {showPatternMenu ? '▲' : '▼'}
          </button>
        </div>
        {/* Save Pattern Modal */}
        {showSaveModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '2rem',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ color: '#fff', marginTop: 0 }}>Save Current Pattern</h3>
              <p style={{ color: '#90e0ef' }}>Give your pattern a name:</p>
              <input
                type="text"
                value={patternName}
                onChange={e => setPatternName(e.target.value)}
                placeholder="My Custom Pattern"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  fontSize: '1rem',
                  marginBottom: '1.5rem'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setPatternName('');
                  }}
                  style={{
                    ...controlButtonStyle,
                    background: '#2a2a2a',
                    padding: '0.75rem 1.5rem'
                  }}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePattern}
                  disabled={!patternName.trim() || isSavingPattern}
                  style={{
                    ...controlButtonStyle,
                    background: '#06d6a0',
                    padding: '0.75rem 1.5rem',
                    opacity: (!patternName.trim() || isSavingPattern) ? 0.5 : 1,
                    cursor: (!patternName.trim() || isSavingPattern) ? 'not-allowed' : 'pointer'
                  }}
                  onMouseOver={e => patternName.trim() && !isSavingPattern && (e.currentTarget.style.backgroundColor = '#05b387')}
                  onMouseOut={e => patternName.trim() && !isSavingPattern && (e.currentTarget.style.backgroundColor = '#06d6a0')}
                >
                  {isSavingPattern ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
       {showPatternMenu && (
  <div
    id="pattern-menu"
    style={{
      position: 'absolute',
      top: menuPosition.top,
      left: menuPosition.left,
      width: '300px',
      maxHeight: '400px',
      overflowY: 'auto',
      backgroundColor: '#1a1a1a',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
      zIndex: 1000,
      padding: '1rem',
      cursor: 'move', // <--- visually shows user it's draggable
    }}
    onMouseDown={startDrag}
  >
    <h3 style={{ color: '#fff', marginTop: 0, marginBottom: '1rem' }}>My Saved Patterns</h3>
    {isLoadingPatternList ? (
      <p style={{ color: '#90e0ef', textAlign: 'center', padding: '1rem 0' }}>
        Loading patterns...
      </p>
    ) : savedPatterns.length === 0 ? (
      <p style={{ color: '#90e0ef', textAlign: 'center', padding: '1rem 0' }}>
        You don't have any saved patterns yet.
      </p>
    ) : (
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {savedPatterns.map(pattern => (
          <li
            key={pattern.id}
            onClick={() => handleLoadPattern(pattern.id)}
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span>{pattern.name}</span>
            <button
              onClick={(e) => handleDeletePattern(pattern.id, e)}
              style={{
                background: '#ff686b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#e05558'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#ff686b'}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)}

      </div>
    </div>
  );
}