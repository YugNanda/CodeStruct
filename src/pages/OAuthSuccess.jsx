import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OAuthSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { oauthLogin } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const error = searchParams.get('error');
        const profileImage = searchParams.get('profileImage');

        if (error) {
            toast.error(error);
            navigate('/signin');
            return;
        }

        if (token && userId && email) {
            const userData = {
                _id: userId,
                name: name || 'Google User',
                email: email,
                token: token,
                profileImage: profileImage || ''
            };

            oauthLogin(userData);
            toast.success('Successfully logged in with Google!');
            navigate('/');
        } else {
            toast.error('Invalid authentication data received');
            navigate('/signin');
        }
    }, [searchParams, navigate, oauthLogin]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <h2 className="text-xl font-semibold text-white">Completing authentication...</h2>
            </div>
        </div>
    );
}
