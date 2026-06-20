import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useFavorites = () => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const getToken = () => {
        return user?.token || localStorage.getItem('token');
    };

    // Fetch all favorites
    const fetchFavorites = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        
        try {
            const token = getToken();
            const response = await fetch('http://localhost:5000/api/favorites', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFavorites(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch favorites:', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Add to favorites
    const addFavorite = useCallback(async (algorithmId) => {
        if (!user) return false;
        
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/favorites/${algorithmId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFavorites(data.favorites || []);
                return true;
            }
        } catch (err) {
            console.error('Failed to add favorite:', err);
        }
        
        return false;
    }, [user]);

    // Remove from favorites
    const removeFavorite = useCallback(async (algorithmId) => {
        if (!user) return false;
        
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/favorites/${algorithmId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFavorites(data.favorites || []);
                return true;
            }
        } catch (err) {
            console.error('Failed to remove favorite:', err);
        }
        
        return false;
    }, [user]);

    // Toggle favorite
    const toggleFavorite = useCallback(async (algorithmId) => {
        if (!user) return false;
        
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/api/favorites/${algorithmId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFavorites(data.favorites || []);
                return data.isFavorite;
            }
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
        
        return false;
    }, [user]);

    // Check if algorithm is favorite
    const isFavorite = useCallback((algorithmId) => {
        return favorites.includes(algorithmId);
    }, [favorites]);

    // Get favorites count
    const getCount = useCallback(() => {
        return favorites.length;
    }, [favorites]);

    // Fetch on mount
    useEffect(() => {
        if (user) {
            fetchFavorites();
        } else {
            setFavorites([]);
        }
    }, [user, fetchFavorites]);

    return {
        favorites,
        isLoading,
        fetchFavorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        getCount
    };
};

export default useFavorites;
