import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const PublicRoute = ({ children }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-900">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (user) {
        // If logged in, redirect away from public pages (like signin/signup)
        // Redirect to the page they came from, or home
        const from = location.state?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    return children;
};

export default PublicRoute;
