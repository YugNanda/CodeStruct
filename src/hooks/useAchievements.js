import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useAchievements = () => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState([]);
    const [unlockedCount, setUnlockedCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [newAchievements, setNewAchievements] = useState([]);

    const getToken = () => {
        return user?.token || localStorage.getItem('token');
    };

    // Fetch all achievements
    const fetchAchievements = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/achievements', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAchievements(data.achievements || []);
                setUnlockedCount(data.unlockedCount || 0);
                setTotalCount(data.totalCount || 0);
            }
        } catch (err) {
            console.error('Failed to fetch achievements:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Check for new achievements after practice
    const checkAchievements = useCallback(async (sessionTime = null) => {
        if (!user) return [];
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/achievements/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionTime })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.newAchievements && data.newAchievements.length > 0) {
                    setNewAchievements(data.newAchievements);
                    // Refresh achievements list
                    await fetchAchievements();
                }
                return data.newAchievements || [];
            }
        } catch (err) {
            console.error('Failed to check achievements:', err);
        }
        
        return [];
    }, [user, fetchAchievements]);

    // Clear new achievements notification
    const clearNewAchievements = useCallback(() => {
        setNewAchievements([]);
    }, []);

    // Get achievement by ID
    const getAchievement = useCallback((id) => {
        return achievements.find(a => a.id === id);
    }, [achievements]);

    // Check if achievement is unlocked
    const isUnlocked = useCallback((id) => {
        const achievement = achievements.find(a => a.id === id);
        return achievement?.unlocked || false;
    }, [achievements]);

    // Calculate achievement progress percentage
    const getProgress = useCallback(() => {
        if (totalCount === 0) return 0;
        return Math.round((unlockedCount / totalCount) * 100);
    }, [unlockedCount, totalCount]);

    // Fetch achievements on mount
    useEffect(() => {
        if (user) {
            fetchAchievements();
        }
    }, [user, fetchAchievements]);

    return {
        achievements,
        unlockedCount,
        totalCount,
        isLoading,
        newAchievements,
        fetchAchievements,
        checkAchievements,
        clearNewAchievements,
        getAchievement,
        isUnlocked,
        getProgress
    };
};

export default useAchievements;
