'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useLayoutEffect } from 'react';
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
    phone: string | null;
    collectorBadge?: string;
}


interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    hydrated: boolean;
    login: (token: string, user: User) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [hydrated, setHydrated] = useState(false);

    // ── Hydrate synchronously on mount ──
    useLayoutEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('bidora_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
            } catch (_) {
                localStorage.removeItem('bidora_user');
            }
        }
        setHydrated(true);
    }, []);

    // ── Background Validation ──
    useEffect(() => {
        if (!hydrated) return;

        const validate = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
                localStorage.setItem('bidora_user', JSON.stringify(res.data));
            } catch (err: any) {
                // Only clear on definitive 401/403. Network errors should keep local state.
                if (err?.response?.status === 401 || err?.response?.status === 403) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('bidora_user');
                    setToken(null);
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };

        validate();
    }, [hydrated, token]);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('bidora_user', JSON.stringify(newUser));
        setLoading(false);
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
        <AuthContext.Provider value={{ user, token, loading, hydrated, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
