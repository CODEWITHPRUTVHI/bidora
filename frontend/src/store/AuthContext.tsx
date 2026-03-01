'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

export interface User {
    id: string;
    email: string;
    fullName: string | null;
    role: 'BUYER' | 'SELLER' | 'ADMIN';
    verifiedStatus: 'BASIC' | 'VERIFIED' | 'PREMIUM';
    trustScore: number;
    walletBalance: number;
    pendingFunds: number;
    avatarUrl: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (token: string, user: User) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Hydrate on mount ──────────────────────────────────────────────
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('bidora_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch (_) { }
        }

        // Silent background validation
        api.get('/auth/me')
            .then(res => {
                setUser(res.data);
                localStorage.setItem('bidora_user', JSON.stringify(res.data));
            })
            .catch((err) => {
                if (err?.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('bidora_user');
                    setToken(null);
                    setUser(null);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('bidora_user', JSON.stringify(newUser));
    };

    const logout = async () => {
        try { await api.post('/auth/logout'); } catch (_) { }
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('bidora_user');
    };

    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            localStorage.setItem('bidora_user', JSON.stringify(res.data));
        } catch (_) { }
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
