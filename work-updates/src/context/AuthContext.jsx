import React, { createContext, useState, useContext, useEffect } from 'react';
import { login } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user_v2') || localStorage.getItem('user');
        try {
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            console.error("AuthContext: Error parsing user from storage", e);
            return null;
        }
    });

    const signIn = async (email, employeeId, password) => {
        try {
            const userData = await login(email, employeeId, password);
            const normalizeAvatar = (u) => {
                if (!u.avatar) {
                    u.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&bold=true`;
                }
                return u;
            };
            const normalized = {
                ...normalizeAvatar(userData),
                token: userData.token || userData.accessToken,
                refreshToken: userData.refreshToken || userData.refresh_token
            };
            setUser(normalized);
            localStorage.setItem('user_v2', JSON.stringify(normalized));
            localStorage.removeItem('user'); // Clean up legacy key
            return normalized;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user_v2');
        localStorage.removeItem('user');
    };

    const updateUser = (updatedData) => {
        setUser(prev => {
            const newUser = { ...prev, ...updatedData };
            localStorage.setItem('user_v2', JSON.stringify(newUser));
            return newUser;
        });
    };

    // 🔄 Keep state in sync with localStorage
    useEffect(() => {
        const syncAuth = (e) => {
            if (e.key === 'user_v2') {
                const newUser = e.newValue ? JSON.parse(e.newValue) : null;
                setUser(newUser);
            }
        };
        window.addEventListener('storage', syncAuth);
        
        // Polling fallback for the SAME tab
        const interval = setInterval(() => {
            const saved = localStorage.getItem('user_v2');
            const parsed = saved ? JSON.parse(saved) : null;
            if (JSON.stringify(parsed?.token) !== JSON.stringify(user?.token)) {
                setUser(parsed);
            }
        }, 5000);

        return () => {
            window.removeEventListener('storage', syncAuth);
            clearInterval(interval);
        };
    }, [user?.token]);

    return (
        <AuthContext.Provider value={{ user, signIn, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
