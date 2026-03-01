'use client';

import { Search, Wallet, Bell, Menu, Flame, Shield, X, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [notifs, setNotifs] = useState<any[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Live notifications fetch + WebSocket
    useEffect(() => {
        if (!user) return;

        // Initial fetch
        api.get('/notifications?limit=5')
            .then(r => {
                setNotifs(r.data.notifications || []);
                setUnread(r.data.unreadCount || 0);
            })
            .catch(() => { });

        // Real-time
        const token = localStorage.getItem('token');
        if (!token) return;
        const { io: socketIO } = require('socket.io-client');
        const socket = socketIO(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000', {
            auth: { token }, transports: ['websocket', 'polling']
        });

        socket.on('notification', (n: any) => {
            setNotifs(prev => [n, ...prev].slice(0, 5));
            setUnread(prev => prev + 1);
        });

        return () => socket.disconnect();
    }, [user?.id]);

    const handleLogout = async () => {
        try { await api.post('/auth/logout'); } catch (_) { }
        await logout();
    };

    const markRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnread(prev => Math.max(0, prev - 1));
        } catch (_) { }
    };

    return (
        <motion.header
            initial={{ y: -100 }} animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] py-1' : 'bg-transparent py-4'}`}
        >
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center space-x-2 flex-shrink-0 z-50">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-yellow-400 rounded-xl flex items-center justify-center rotate-3 hover:rotate-6 transition-transform shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    </div>
                    <span className="text-lg sm:text-xl font-black tracking-tighter text-white">BIDORA</span>
                </Link>

                {/* Search - Desktop Only */}
                <form onSubmit={e => { e.preventDefault(); const q = (e.currentTarget.querySelector('input') as HTMLInputElement).value; if (q) router.push(`/search?q=${encodeURIComponent(q)}`); }} className="hidden md:flex flex-1 max-w-md mx-10 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                    <input type="text" placeholder="Search auctions, items, sellers…"
                        className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-full py-3 pl-11 pr-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:bg-zinc-900 focus:border-yellow-400/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] placeholder:text-gray-500" />
                </form>

                {/* Right Actions */}
                <div className="flex items-center gap-2 sm:gap-5">
                    {/* Mobile Search Icon */}
                    <button
                        onClick={() => { setMenuOpen(true); setTimeout(() => document.getElementById('mobile-search')?.focus(), 150); }}
                        className="md:hidden p-2 text-gray-400 hover:text-white"
                    >
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Notification Bell */}
                    {user && (
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifs(!showNotifs)}
                                className={`relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full ${showNotifs ? 'bg-white/10 text-white' : ''}`}
                            >
                                <Bell className="w-5 h-5" />
                                {unread > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center animate-bounce">
                                        {unread > 9 ? '9+' : unread}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifs && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-4 w-80 md:w-96 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-20 overflow-hidden"
                                        >
                                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                                <h3 className="font-black text-white">Notifications</h3>
                                                <button onClick={() => { setShowNotifs(false); router.push('/dashboard?tab=notifs'); }} className="text-[10px] font-bold text-yellow-400 hover:underline uppercase tracking-widest">
                                                    View All
                                                </button>
                                            </div>
                                            <div className="max-h-[400px] overflow-y-auto hide-scrollbar">
                                                {notifs.length === 0 ? (
                                                    <div className="p-10 text-center">
                                                        <Bell className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                                        <p className="text-zinc-500 text-xs font-bold">No notifications yet</p>
                                                    </div>
                                                ) : notifs.map(n => (
                                                    <div key={n.id} onClick={() => { markRead(n.id); if (n.referenceId) router.push(`/auctions/${n.referenceId}`); }} className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex gap-4 ${n.isRead ? 'opacity-60' : 'bg-yellow-400/5'}`}>
                                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl flex-shrink-0">
                                                            {n.type === 'AUCTION_WON' ? '🏆' : n.type === 'OUTBID' ? '🔔' : '💬'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-white truncate">{n.title}</p>
                                                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.body}</p>
                                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        {!n.isRead && <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0 shadow-[0_0_10px_rgba(250,204,21,0.5)]" />}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* My Orders Quick Link */}
                    {user && (
                        <Link href="/dashboard?tab=orders" className="hidden lg:flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
                            <ShoppingBag className="w-4 h-4 text-yellow-400" />
                            <span className="font-semibold text-sm">Orders</span>
                        </Link>
                    )}

                    {/* Wallet Balance */}
                    {user && (
                        <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
                            <Wallet className="w-4 h-4 text-yellow-400" />
                            <span className="font-semibold text-sm">₹{(user.walletBalance - user.pendingFunds).toLocaleString()}</span>
                        </Link>
                    )}

                    {/* Admin Link */}
                    {user?.role === 'ADMIN' && (
                        <Link href="/admin" className="hidden sm:flex items-center gap-1.5 text-black hover:text-black bg-yellow-400 hover:bg-yellow-300 transition-colors text-xs font-black px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                            <Shield className="w-4 h-4" /> ADMIN
                        </Link>
                    )}

                    {!user ? (
                        <Link href="/auth" className="bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 px-6 py-2.5 rounded-full font-black text-sm hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_10px_30px_-10px_rgba(250,204,21,0.5)] border border-yellow-300">
                            Sign In
                        </Link>
                    ) : (
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 text-sm font-semibold transition-colors hidden sm:block">
                            Log out
                        </button>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-white bg-white/5 rounded-xl border border-white/10 active:scale-90 transition-transform"
                        onClick={() => setMenuOpen(!menuOpen)}
                    >
                        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
                            onClick={() => setMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-zinc-950 z-[70] md:hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <span className="text-xl font-black tracking-tighter text-white">MENU</span>
                                <button onClick={() => setMenuOpen(false)} className="p-2 bg-white/5 rounded-xl border border-white/10">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Mobile Search */}
                                <form onSubmit={e => { e.preventDefault(); const q = (e.currentTarget.querySelector('input') as HTMLInputElement).value; if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); setMenuOpen(false); } }} className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input id="mobile-search" type="text" placeholder="Search anything…"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-11 pr-5 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all" />
                                </form>

                                <nav className="space-y-4">
                                    <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 text-lg font-bold text-gray-300 hover:text-white p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center">🏠</div>
                                        Home
                                    </Link>
                                    {user && (
                                        <>
                                            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 text-lg font-bold text-gray-300 hover:text-white p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">📊</div>
                                                Dashboard
                                            </Link>
                                            <Link href="/dashboard?tab=orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 text-lg font-bold text-gray-300 hover:text-white p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">🛍️</div>
                                                My Orders
                                            </Link>
                                        </>
                                    )}
                                    {user?.role === 'ADMIN' && (
                                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-4 text-lg font-bold text-black p-4 bg-yellow-400 rounded-2xl">
                                            <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">🛡️</div>
                                            Admin Panel
                                        </Link>
                                    )}
                                </nav>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-white/[0.02]">
                                {!user ? (
                                    <Link href="/auth" onClick={() => setMenuOpen(false)} className="block bg-yellow-400 text-zinc-950 py-4 rounded-2xl font-black text-center shadow-[0_10px_30px_-10px_rgba(250,204,21,0.5)]">
                                        Sign In
                                    </Link>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-black">
                                                {user.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-bold truncate">{user.fullName}</p>
                                                <p className="text-yellow-400 text-xs font-bold">₹{(user.walletBalance ?? 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full text-red-500 py-4 font-black border border-red-500/20 rounded-2xl hover:bg-red-500/5">
                                            Log out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
