import { createContext, useContext, useState, useCallback } from 'react';

const AnalyticsContext = createContext(null);

const STORAGE_KEY = 'dsa_visualizer_analytics_history';

export const AnalyticsProvider = ({ children }) => {
  // Load history from localStorage on init
  const [sessionHistory, setSessionHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [currentSession, setCurrentSession] = useState(null);
  const [realTimeData, setRealTimeData] = useState({});

  // Save history to localStorage whenever it changes
  const saveHistory = useCallback((history) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  }, []);

  // Add a new session to history
  const addSession = useCallback((sessionData) => {
    const newSession = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...sessionData,
    };

    setSessionHistory((prev) => {
      // Keep only last 50 sessions
      const updated = [newSession, ...prev].slice(0, 50);
      saveHistory(updated);
      return updated;
    });

    setCurrentSession(newSession);
    return newSession.id;
  }, [saveHistory]);

  // Clear all history
  const clearHistory = useCallback(() => {
    setSessionHistory([]);
    saveHistory([]);
  }, [saveHistory]);

  // Delete a specific session
  const deleteSession = useCallback((sessionId) => {
    setSessionHistory((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      saveHistory(updated);
      return updated;
    });
  }, [saveHistory]);

  // Update real-time data during algorithm execution
  const updateRealTimeData = useCallback((algoId, dataPoint) => {
    setRealTimeData((prev) => ({
      ...prev,
      [algoId]: [...(prev[algoId] || []), dataPoint],
    }));
  }, []);

  // Reset real-time data for new comparison
  const resetRealTimeData = useCallback(() => {
    setRealTimeData({});
  }, []);

  // Get session by ID
  const getSession = useCallback((sessionId) => {
    return sessionHistory.find((s) => s.id === sessionId) || null;
  }, [sessionHistory]);

  // Get statistics across all sessions
  const getGlobalStats = useCallback(() => {
    if (sessionHistory.length === 0) return null;

    const algoStats = {};
    
    sessionHistory.forEach((session) => {
      session.algorithms?.forEach((algo) => {
        const result = session.results?.[algo.id];
        if (!result) return;

        if (!algoStats[algo.id]) {
          algoStats[algo.id] = {
            name: algo.name,
            totalRuns: 0,
            totalComparisons: 0,
            totalSwaps: 0,
            totalTime: 0,
            bestTime: Infinity,
            worstTime: 0,
          };
        }

        const stats = algoStats[algo.id];
        stats.totalRuns++;
        stats.totalComparisons += result.comparisons || 0;
        stats.totalSwaps += result.swaps || 0;
        const time = result.isComplete ? session.elapsedTime : 0;
        stats.totalTime += time;
        stats.bestTime = Math.min(stats.bestTime, time);
        stats.worstTime = Math.max(stats.worstTime, time);
      });
    });

    // Calculate averages
    Object.values(algoStats).forEach((stats) => {
      stats.avgComparisons = Math.round(stats.totalComparisons / stats.totalRuns);
      stats.avgSwaps = Math.round(stats.totalSwaps / stats.totalRuns);
      stats.avgTime = (stats.totalTime / stats.totalRuns).toFixed(2);
    });

    return {
      totalSessions: sessionHistory.length,
      algorithmStats: algoStats,
    };
  }, [sessionHistory]);

  const value = {
    sessionHistory,
    currentSession,
    realTimeData,
    addSession,
    clearHistory,
    deleteSession,
    getSession,
    getGlobalStats,
    updateRealTimeData,
    resetRealTimeData,
    setCurrentSession,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};
