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
        
        return () => {
            window.removeEventListener('storage', syncAuth);
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
