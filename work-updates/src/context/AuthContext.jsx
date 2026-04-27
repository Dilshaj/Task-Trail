import React, { createContext, useState, useContext, useEffect } from 'react';
import { login } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user_v2');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const signIn = async (email, employeeId, password) => {
        try {
            const userData = await login(email, employeeId, password);
            const normalizeAvatar = (u) => {
                if (u.avatar) {
                    // Logic to ensure it's a valid URL or path
                    if (!u.avatar.includes('http') && u.avatar.startsWith('/uploads')) {
                        // Let the proxy handle it
                    }
                } else {
                    u.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&color=fff&bold=true`;
                }
                return u;
            };
            const normalized = normalizeAvatar(userData);
            setUser(normalized);
            localStorage.setItem('user_v2', JSON.stringify(normalized));
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

    return (
        <AuthContext.Provider value={{ user, signIn, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
