'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Mail, User as UserIcon, ShoppingBag, Tag, Eye, EyeOff, Flame } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';
import GoogleButton from '@/components/auth/GoogleButton';
import PhoneOTPForm from '@/components/auth/PhoneOTPForm';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { login, user, loading: authLoading } = useAuth();

    React.useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin
                ? { email, password }
                : { email, password, fullName, role };

            const response = await api.post(endpoint, payload);
            // Backend returns accessToken (not token)
            const token = response.data.accessToken || response.data.token;
            login(token, response.data.user);
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            const msg = err.response?.data?.error
                || (err.request ? 'Server is unreachable. Please check your internet or try again later.' : 'Authentication failed. Please try again.');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-zinc-950">
            {/* Ambient Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-yellow-500/10 blur-[120px]" />
                <div className="absolute bottom-[0%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-amber-600/10 blur-[100px]" />
            </div>

            <Link href="/" className="absolute top-6 left-6 flex items-center text-gray-400 hover:text-white transition-colors group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
            </Link>

            {/* Logo */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center rotate-3">
                    <Flame className="w-4 h-4 text-black" />
                </div>
                <span className="font-black text-white tracking-tighter text-lg">BIDORA</span>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-10"
            >
                {/* Tab Toggle */}
                <div className="flex bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 mb-6 shadow-xl">
                    {(['login', 'register'] as const).map(tab => (
                        <button key={tab} type="button"
                            onClick={() => { setIsLogin(tab === 'login'); setError(''); }}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${isLogin === (tab === 'login')
                                ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 shadow-[0_4px_20px_rgba(250,204,21,0.3)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            {tab === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    ))}
                </div>

                <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-500" />

                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                        {isLogin ? 'Welcome back 👋' : 'Create your account'}
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                        {isLogin ? 'Sign in to access your bids and wallet.' : 'Join thousands of buyers and sellers on Bidora.'}
                    </p>

                    {/* ── Google OAuth ── */}
                    <GoogleButton onError={setError} />

                    {/* ── Divider ── */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-600 text-xs font-semibold uppercase tracking-widest">or with email</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Role Selector — only on register */}
                    <AnimatePresence>
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="mb-5"
                            >
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">I want to…</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Buyer Option */}
                                    <button type="button" onClick={() => setRole('BUYER')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === 'BUYER'
                                            ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}>
                                        <ShoppingBag className="w-7 h-7" />
                                        <span className="font-bold text-sm">Buy Items</span>
                                        <span className="text-xs opacity-70">Bid & win auctions</span>
                                    </button>
                                    {/* Seller Option */}
                                    <button type="button" onClick={() => setRole('SELLER')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${role === 'SELLER'
                                            ? 'border-blue-400 bg-blue-400/10 text-blue-400'
                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}>
                                        <Tag className="w-7 h-7" />
                                        <span className="font-bold text-sm">Sell Items</span>
                                        <span className="text-xs opacity-70">List & earn</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-4 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name — register only */}
                        <AnimatePresence>
                            {!isLogin && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                                            required placeholder="Full Name"
                                            className="w-full bg-zinc-950/60 border border-white/10 text-white rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-yellow-400/50 focus:bg-zinc-950 transition-all placeholder:text-gray-500" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                required placeholder="Email Address"
                                className="w-full bg-zinc-950/60 border border-white/10 text-white rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-yellow-400/50 focus:bg-zinc-950 transition-all placeholder:text-gray-500" />
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                required placeholder={isLogin ? 'Password' : 'Password (min 8 characters)'}
                                className="w-full bg-zinc-950/60 border border-white/10 text-white rounded-xl py-3.5 pl-11 pr-12 focus:outline-none focus:border-yellow-400/50 focus:bg-zinc-950 transition-all placeholder:text-gray-500" />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-4 top-3.5 text-gray-500 hover:text-white transition-colors">
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <button disabled={loading} type="submit"
                            className="w-full bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 font-black py-4 rounded-xl transition-all shadow-[0_10px_30px_-10px_rgba(250,204,21,0.5)] mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 border border-yellow-300">
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : isLogin ? '⚡ Sign In' : `🚀 Create ${role === 'SELLER' ? 'Seller' : 'Buyer'} Account`}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-600 mt-5">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
                            {isLogin ? 'Sign Up Free' : 'Sign In'}
                        </button>
                    </p>

                    {/* ── Divider ── */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-600 text-xs font-semibold uppercase tracking-widest">or with phone</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* ── Phone OTP Login ── */}
                    <PhoneOTPForm onError={setError} />
                </div>
            </motion.div>
        </div>
    );
}
