import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useStreaks = () => {
    const { user } = useAuth();
    const [streakData, setStreakData] = useState({
        currentStreak: 0,
        longestStreak: 0,
        totalPracticeDays: 0,
        practicedToday: false,
        lastPracticeDate: null
    });
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const getToken = () => {
        return user?.token || localStorage.getItem('token');
    };

    // Fetch streak data
    const fetchStreaks = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/streaks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStreakData({
                    currentStreak: data.currentStreak || 0,
                    longestStreak: data.longestStreak || 0,
                    totalPracticeDays: data.totalPracticeDays || 0,
                    practicedToday: data.practicedToday || false,
                    lastPracticeDate: data.lastPracticeDate
                });
            }
        } catch (err) {
            console.error('Failed to fetch streaks:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Fetch practice history
    const fetchHistory = useCallback(async (days = 90) => {
        if (!user) return;
        
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/streaks/history?days=${days}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setHistory(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    }, [user]);

    // Record practice session
    const recordPractice = useCallback(async (timeSpent = 0) => {
        if (!user) return null;
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/streaks/practice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ timeSpent })
            });

            if (response.ok) {
                const data = await response.json();
                // Refresh streak data
                await fetchStreaks();
                await fetchHistory();
                return data;
            }
        } catch (err) {
            console.error('Failed to record practice:', err);
        }
        
        return null;
    }, [user, fetchStreaks, fetchHistory]);

    // Get streak status message
    const getStatusMessage = useCallback(async () => {
        if (!user) return null;
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/streaks/status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.error('Failed to get status:', err);
        }
        
        return null;
    }, [user]);

    // Calculate streak heatmap data
    const getHeatmapData = useCallback(() => {
        // Create a map of dates with practice
        const practiceMap = new Map();
        
        history.forEach(session => {
            const date = new Date(session.date).toISOString().split('T')[0];
            practiceMap.set(date, session.totalTime);
        });

        return practiceMap;
    }, [history]);

    // Check if streak is at risk (practiced yesterday but not today)
    const isStreakAtRisk = useCallback(() => {
        return streakData.currentStreak > 0 && !streakData.practicedToday;
    }, [streakData]);

    // Format streak for display
    const formatStreak = useCallback(() => {
        if (streakData.currentStreak === 0) {
            return 'Start your streak!';
        } else if (streakData.currentStreak === 1) {
            return '1 day';
        } else {
            return `${streakData.currentStreak} days`;
        }
    }, [streakData.currentStreak]);

    // Fetch on mount
    useEffect(() => {
        if (user) {
            fetchStreaks();
            fetchHistory();
        }
    }, [user, fetchStreaks, fetchHistory]);

    return {
        streakData,
        history,
        isLoading,
        fetchStreaks,
        fetchHistory,
        recordPractice,
        getStatusMessage,
        getHeatmapData,
        isStreakAtRisk,
        formatStreak
    };
};

export default useStreaks;
