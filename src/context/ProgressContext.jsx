import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const ProgressContext = createContext();

export const ProgressProvider = ({ children }) => {
    const { user } = useAuth();
    const [progress, setProgress] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get auth token
    const getToken = () => {
        return user?.token || localStorage.getItem('token');
    };

    // Fetch user progress
    const fetchProgress = async () => {
        if (!user) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/progress', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setProgress(data.progress || {});
            }
        } catch (err) {
            setError('Failed to fetch progress');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Update algorithm progress
    const updateProgress = async (algorithmId, status, timeSpent = 0) => {
        if (!user) return null;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/progress/${algorithmId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, timeSpent })
            });

            if (response.ok) {
                const data = await response.json();
                // Refresh progress after update
                await fetchProgress();
                return data;
            } else {
                const data = await response.json();
                setError(data.message);
                return null;
            }
        } catch (err) {
            setError('Failed to update progress');
            console.error(err);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Get specific algorithm progress
    const getAlgorithmProgress = (algorithmId) => {
        return progress[algorithmId] || {
            status: 'not_started',
            practiceCount: 0,
            totalTimeSpent: 0,
            lastPracticed: null,
            completedAt: null
        };
    };

    // Check if algorithm is completed
    const isAlgorithmMastered = (algorithmId) => {
        return progress[algorithmId]?.status === 'mastered';
    };

    // Check if algorithm is practiced
    const isAlgorithmPracticed = (algorithmId) => {
        const algoProgress = progress[algorithmId];
        return algoProgress?.status === 'practiced' || algoProgress?.status === 'mastered';
    };

    // Fetch progress on user login
    useEffect(() => {
        if (user) {
            fetchProgress();
        } else {
            setProgress({});
        }
    }, [user]);

    const value = {
        progress,
        isLoading,
        error,
        fetchProgress,
        updateProgress,
        getAlgorithmProgress,
        isAlgorithmMastered,
        isAlgorithmPracticed
    };

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
};

export const useProgress = () => useContext(ProgressContext);

export default ProgressContext;
