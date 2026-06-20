import { useState, useCallback, useRef, useEffect } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';


// Algorithm metadata for comparison mode
export const comparisonAlgorithms = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'Sorting',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  {
    id: 'selection-sort',
    name: 'Selection Sort',
    category: 'Sorting',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  {
    id: 'quick-sort',
    name: 'Quick Sort',
    category: 'Sorting',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort',
    category: 'Sorting',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
  },
  {
    id: 'heap-sort',
    name: 'Heap Sort',
    category: 'Sorting',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
  },
  {
    id: 'insertion-sort',
    name: 'Insertion Sort',
    category: 'Sorting',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
  },
  {
    id: 'radix-sort',
    name: 'Radix Sort',
    category: 'Sorting',
    best: 'O(nk)',
    average: 'O(nk)',
    worst: 'O(nk)',
    space: 'O(n+k)',
  },
];

// Import algorithm run functions dynamically
const algorithmImports = {
  'bubble-sort': () => import('../algorithms/bubbleSort').then(m => m.bubbleSort),
  'selection-sort': () => import('../algorithms/selectionSort').then(m => m.selectionSort),
  'quick-sort': () => import('../algorithms/quickSort').then(m => m.quickSort),
  'merge-sort': () => import('../algorithms/mergeSort').then(m => m.mergeSort),
  'heap-sort': () => import('../algorithms/heapSort').then(m => m.heapSort),
  'insertion-sort': () => import('../algorithms/insertionSort').then(m => m.insertionSort),
  'radix-sort': () => import('../algorithms/radixSort').then(m => m.radixSort),
};

export const useComparison = () => {
  const [selectedAlgorithms, setSelectedAlgorithms] = useState([]);
  const [array, setArray] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [arraySize, setArraySize] = useState(20);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Stats for each algorithm
  const [algorithmStats, setAlgorithmStats] = useState({});
  
  // Real-time data tracking for charts
  const [realTimeData, setRealTimeData] = useState({});
  
  // Array type/scenario tracking
  const [arrayType, setArrayType] = useState('random');
  
  // Track array state for each selected algorithm
  const [algorithmArrays, setAlgorithmArrays] = useState({});
  
  // Refs for controlling execution

  const stopSignal = useRef(false);
  const pauseSignal = useRef(false);
  const timerRef = useRef(null);
  const elapsedTimeRef = useRef(0);
  const algorithmStatsRef = useRef({});
  
  // Get analytics context
  const { addSession, resetRealTimeData, updateRealTimeData } = useAnalytics();


  // Reset all stats
  const resetStats = useCallback(() => {
    const newStats = {};
    selectedAlgorithms.forEach(algo => {
      newStats[algo.id] = {
        comparisons: 0,
        swaps: 0,
        isRunning: false,
        isComplete: false,
        currentStep: 0,
      };
    });
    setAlgorithmStats(newStats);
    algorithmStatsRef.current = newStats;
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    setIsRunning(false);
    setIsPaused(false);
    setRealTimeData({});
    setAlgorithmArrays({});
    resetRealTimeData();
    stopSignal.current = false;
    pauseSignal.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [selectedAlgorithms, resetRealTimeData]);

  const initializeStats = useCallback(() => {
    const newStats = {};
    selectedAlgorithms.forEach(algo => {
      newStats[algo.id] = {
        comparisons: 0,
        swaps: 0,
        isRunning: false,
        isComplete: false,
        currentStep: 0,
      };
    });
    setAlgorithmStats(newStats);
    algorithmStatsRef.current = newStats;
  }, [selectedAlgorithms]);

  // Generate random array
  const generateRandomArray = useCallback((size = arraySize) => {
    setArraySize(size);
    const newArray = Array.from({ length: size }, () => ({
      value: Math.floor(Math.random() * 400) + 20,
      status: 'default',
    }));
    setArray(newArray);
    resetStats();
  }, [arraySize, resetStats]);

  // Select algorithms to compare (2-4)
  const toggleAlgorithm = useCallback((algorithm) => {
    setSelectedAlgorithms(prev => {
      const isSelected = prev.some(a => a.id === algorithm.id);
      
      if (isSelected) {
        // Remove algorithm
        return prev.filter(a => a.id !== algorithm.id);
      } else {
        // Add algorithm (max 4)
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, algorithm];
      }
    });
  }, []);

  // Update stat for a specific algorithm
  const updateStat = useCallback((algoId, statType, value) => {
    algorithmStatsRef.current = {
      ...algorithmStatsRef.current,
      [algoId]: {
        ...algorithmStatsRef.current[algoId],
        [statType]: value,
      }
    };
    setAlgorithmStats(prev => ({
      ...prev,
      [algoId]: {
        ...prev[algoId],
        [statType]: value,
      }
    }));
  }, []);

  // Increment stat for a specific algorithm
  const incrementStat = useCallback((algoId, statType, amount = 1) => {
    const currentVal = algorithmStatsRef.current[algoId]?.[statType] || 0;
    const newVal = currentVal + amount;
    
    algorithmStatsRef.current = {
      ...algorithmStatsRef.current,
      [algoId]: {
        ...algorithmStatsRef.current[algoId],
        [statType]: newVal,
      }
    };

    setAlgorithmStats(prev => ({
      ...prev,
      [algoId]: {
        ...prev[algoId],
        [statType]: (prev[algoId]?.[statType] || 0) + amount,
      }
    }));
  }, []);

  // Run all selected algorithms simultaneously
  const runComparison = useCallback(async () => {
    if (selectedAlgorithms.length < 2 || array.length === 0) return;

    stopSignal.current = false;
    pauseSignal.current = false;
    setIsRunning(true);
    setIsPaused(false);
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    setRealTimeData({});
    resetRealTimeData();

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => {
        const next = prev + 1;
        elapsedTimeRef.current = next;
        return next;
      });
    }, 1000);

    // Initialize individual arrays for each algorithm
    const initialArrays = {};
    selectedAlgorithms.forEach(algo => {
      initialArrays[algo.id] = array.map(item => ({ ...item }));
    });
    setAlgorithmArrays(initialArrays);

    // Initial copies for algorithm functions
    const arrayCopies = { ...initialArrays };

    // Initialize stats
    const newStats = {};
    selectedAlgorithms.forEach(algo => {
      newStats[algo.id] = {
        comparisons: 0,
        swaps: 0,
        isRunning: true,
        isComplete: false,
        currentStep: 0,
      };
    });
    setAlgorithmStats(newStats);
    algorithmStatsRef.current = newStats;

    // Track step counter for real-time data
    const stepCounters = {};
    selectedAlgorithms.forEach(algo => {
      stepCounters[algo.id] = 0;
    });

    const createSetArrayForAlgo = (algoId) => {
      return (newArray) => {
        arrayCopies[algoId] = newArray;
        setAlgorithmArrays(prev => ({
          ...prev,
          [algoId]: [...newArray]
        }));
      };
    };

    // Create a custom updateStepInfo for each algorithm with real-time tracking
    const createUpdateStepInfoForAlgo = (algoId) => {
      return (stepInfo) => {
        let comparisons = 0;
        let swaps = 0;
        
        if (stepInfo.operation?.includes('Comparing')) {
          incrementStat(algoId, 'comparisons');
          comparisons = 1;
        }
        if (stepInfo.operation?.includes('Swapping')) {
          incrementStat(algoId, 'swaps');
          swaps = 1;
        }
        if (stepInfo.currentStep !== undefined) {
          updateStat(algoId, 'currentStep', stepInfo.currentStep);
        }

        // Track real-time data every 5 steps to avoid too many updates
        stepCounters[algoId]++;
        if (stepCounters[algoId] % 5 === 0 || comparisons > 0 || swaps > 0) {
          const currentStats = algorithmStatsRef.current[algoId] || {};
          const dataPoint = {
            step: stepCounters[algoId],
            comparisons: (currentStats.comparisons || 0) + comparisons,
            swaps: (currentStats.swaps || 0) + swaps,
            timestamp: Date.now(),
          };
          
          setRealTimeData(prev => ({
            ...prev,
            [algoId]: [...(prev[algoId] || []), dataPoint],
          }));
          
          updateRealTimeData(algoId, dataPoint);
        }
      };
    };

    // Run all algorithms concurrently
    const runPromises = selectedAlgorithms.map(async (algo) => {
      try {
        const runAlgo = await algorithmImports[algo.id]();
        
        // Mark as running
        setAlgorithmStats(prev => ({
          ...prev,
          [algo.id]: { ...prev[algo.id], isRunning: true }
        }));

        await runAlgo(
          arrayCopies[algo.id],
          createSetArrayForAlgo(algo.id),
          speed,
          stopSignal,
          pauseSignal,
          createUpdateStepInfoForAlgo(algo.id)
        );

        // Mark as complete
        if (!stopSignal.current) {
          setAlgorithmStats(prev => ({
            ...prev,
            [algo.id]: { 
              ...prev[algo.id], 
              isComplete: true, 
              isRunning: false,
              finishTime: elapsedTimeRef.current 
            }
          }));
        }
      } catch (error) {
        console.error(`Error running ${algo.name}:`, error);
        setAlgorithmStats(prev => ({
          ...prev,
          [algo.id]: { ...prev[algo.id], isRunning: false }
        }));
      }
    });

    await Promise.all(runPromises);

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);

    addSession({
      algorithms: selectedAlgorithms,
      arraySize,
      arrayType,
      elapsedTime: elapsedTimeRef.current,
      results: algorithmStatsRef.current,
      speed,
    });
  }, [selectedAlgorithms, array, speed, arraySize, arrayType, incrementStat, updateStat, addSession, updateRealTimeData, resetRealTimeData]);

  // Set array from scenario
  const setArrayFromScenario = useCallback((scenario, newArray) => {
    setArrayType(scenario);
    setArraySize(newArray.length);
    setArray(newArray);
    resetStats();
  }, [resetStats]);


  // Pause all algorithms
  const pauseComparison = useCallback(() => {
    pauseSignal.current = true;
    setIsPaused(true);
  }, []);

  // Resume all algorithms
  const resumeComparison = useCallback(() => {
    pauseSignal.current = false;
    setIsPaused(false);
  }, []);

  // Stop all algorithms
  const stopComparison = useCallback(() => {
    stopSignal.current = true;
    pauseSignal.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    // State
    selectedAlgorithms,
    array,
    isRunning,
    isPaused,
    speed,
    arraySize,
    elapsedTime,
    algorithmStats,
    realTimeData,
    algorithmArrays,
    arrayType,
    
    // Actions
    setSelectedAlgorithms: toggleAlgorithm,
    generateRandomArray,
    setArray,
    setSpeed,
    setArraySize,
    runComparison,
    pauseComparison,
    resumeComparison,
    stopComparison,
    resetStats,
    initializeStats,
    setArrayFromScenario,
    
    // Helpers
    canCompare: selectedAlgorithms.length >= 2 && selectedAlgorithms.length <= 4,
    isMaxSelected: selectedAlgorithms.length >= 4,
  };

};
