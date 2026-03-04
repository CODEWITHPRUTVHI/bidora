'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';

// Google SVG (official coloured logo)
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

interface GoogleButtonProps {
    onError?: (msg: string) => void;
}

export default function GoogleButton({ onError }: GoogleButtonProps) {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleGoogleLogin = useCallback(() => {
        if (typeof window === 'undefined' || !window.google) {
            onError?.('Google sign-in is not available. Please refresh the page.');
            return;
        }

        setLoading(true);

        window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: async (response: { credential: string }) => {
                try {
                    const res = await api.post('/auth/google', { googleToken: response.credential });
                    // Use same login() as email/password — stores to localStorage identically
                    login(res.data.accessToken, res.data.user);
                    router.push('/dashboard');
                } catch (err: any) {
                    const msg = err.response?.data?.error || 'Google sign-in failed. Please try again.';
                    onError?.(msg);
                } finally {
                    setLoading(false);
                }
            },
            ux_mode: 'popup',
        });

        window.google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback: render a button and click it
                window.google.accounts.id.renderButton(
                    document.getElementById('google-button-fallback')!,
                    { type: 'standard', size: 'large', width: 400 }
                );
                setLoading(false);
            }
        });
    }, [login, router, onError]);

    return (
        <>
            {/* Google GSI script */}
            <script src="https://accounts.google.com/gsi/client" async defer />

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 px-6 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                ) : (
                    <GoogleIcon />
                )}
                <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
            </button>

            {/* Hidden fallback container for GSI renderButton */}
            <div id="google-button-fallback" className="hidden" />
        </>
    );
}
