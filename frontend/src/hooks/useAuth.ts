import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    email: string;
    name: string;
}

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/auth/check', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                setIsAuthenticated(true);
                setUser(data.user);
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } catch (error) {
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credential: string) => {
        try {
            const decoded = jwtDecode(credential);
            const response = await fetch('http://localhost:3000/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: (decoded as any).email,
                    name: (decoded as any).name
                })
            });

            if (response.ok) {
                setIsAuthenticated(true);
                setUser({
                    email: (decoded as any).email,
                    name: (decoded as any).name
                });
            }
        } catch (error) {
            console.error('Authentication error:', error);
        }
    };

    return { isAuthenticated, loading, user, handleGoogleLogin };
};
