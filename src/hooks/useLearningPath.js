import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useLearningPath = () => {
    const { user } = useAuth();
    const [paths, setPaths] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const getToken = () => {
        return user?.token || localStorage.getItem('token');
    };

    // Fetch all learning paths
    const fetchPaths = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/learning-paths', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPaths(data.paths || []);
            }
        } catch (err) {
            console.error('Failed to fetch learning paths:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Fetch recommendations
    const fetchRecommendations = useCallback(async () => {
        if (!user) return;
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/learning-paths/recommendations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRecommendations(data.recommendations || []);
                return data.recommendations;
            }
        } catch (err) {
            console.error('Failed to fetch recommendations:', err);
        }
        
        return [];
    }, [user]);

    // Get specific path details
    const getPathDetails = useCallback(async (pathId) => {
        if (!user) return null;
        
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/learning-paths/${pathId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (err) {
            console.error('Failed to fetch path details:', err);
        }
        
        return null;
    }, [user]);

    // Start a learning path
    const startPath = useCallback(async (pathId) => {
        if (!user) return false;
        
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/learning-paths/${pathId}/start`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Refresh paths after starting
                await fetchPaths();
                return true;
            }
        } catch (err) {
            console.error('Failed to start path:', err);
        }
        
        return false;
    }, [user, fetchPaths]);

    // Get paths by difficulty
    const getPathsByDifficulty = useCallback((difficulty) => {
        return paths.filter(path => path.difficulty === difficulty);
    }, [paths]);

    // Get in-progress paths
    const getInProgressPaths = useCallback(() => {
        return paths.filter(path => path.isStarted && !path.isCompleted);
    }, [paths]);

    // Get completed paths
    const getCompletedPaths = useCallback(() => {
        return paths.filter(path => path.isCompleted);
    }, [paths]);

    // Get next recommended step
    const getNextRecommendedStep = useCallback(async () => {
        const recs = await fetchRecommendations();
        if (recs && recs.length > 0) {
            const firstPath = recs[0];
            return firstPath.nextStep;
        }
        return null;
    }, [fetchRecommendations]);

    // Calculate overall progress
    const getOverallProgress = useCallback(() => {
        if (paths.length === 0) return 0;
        
        const totalProgress = paths.reduce((sum, path) => sum + path.progressPercent, 0);
        return Math.round(totalProgress / paths.length);
    }, [paths]);

    // Fetch on mount
    useEffect(() => {
        if (user) {
            fetchPaths();
            fetchRecommendations();
        }
    }, [user, fetchPaths, fetchRecommendations]);

    return {
        paths,
        recommendations,
        isLoading,
        fetchPaths,
        fetchRecommendations,
        getPathDetails,
        startPath,
        getPathsByDifficulty,
        getInProgressPaths,
        getCompletedPaths,
        getNextRecommendedStep,
        getOverallProgress
    };
};

export default useLearningPath;
