'use client';

import {
    Search, Wallet, Menu, Shield, X, Flame,
    ShoppingBag, MessageCircle, Home, LayoutDashboard,
    Package, ShieldCheck, AlertCircle, CreditCard, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import {
    BellAnimated, TrophyAnimated,
    PackageAnimated, HoverIcon
} from '@/components/ui/AnimatedIcon';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [notifs, setNotifs] = useState<any[]>([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const { user, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!user) return;
        api.get('/notifications?limit=5')
            .then(r => { setNotifs(r.data.notifications || []); setUnread(r.data.unreadCount || 0); })
            .catch(() => { });

        const token = localStorage.getItem('token');
        if (!token) return;
        const { io: socketIO } = require('socket.io-client');
        const socket = socketIO(process.env.NEXT_PUBLIC_WS_URL || 'https://bidora-api-production.up.railway.app', {
            auth: { token }, transports: ['websocket', 'polling']
        });
        socket.on('notification', (n: any) => { setNotifs(prev => [n, ...prev].slice(0, 5)); setUnread(prev => prev + 1); });
        socket.on('new_message', () => { setUnreadMessages(prev => prev + 1); });
        api.get('/messages/unread-count').then(r => setUnreadMessages(r.data.count ?? 0)).catch(() => { });
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

    const NotifIcon = ({ type }: { type: string }) => {
        if (type === 'AUCTION_WON') return <TrophyAnimated className="w-5 h-5 text-yellow-400" />;
        if (type === 'OUTBID') return <BellAnimated className="w-5 h-5 text-orange-400" hasUnread />;
        if (type === 'PAYMENT_REQUIRED') return <CreditCard className="w-5 h-5 text-blue-400" />;
        if (type === 'ITEM_SHIPPED') return <PackageAnimated className="w-5 h-5 text-purple-400" />;
        if (type === 'DISPUTE_OPENED') return <AlertCircle className="w-5 h-5 text-red-400" />;
        return <MessageSquare className="w-5 h-5 text-gray-400" />;
    };

    const navLinks = [
        { href: '/', label: 'Home', icon: Home, color: 'bg-yellow-400/10 text-yellow-400' },
        ...(user ? [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-blue-500/10 text-blue-400' },
            { href: '/dashboard?tab=orders', label: 'My Orders', icon: Package, color: 'bg-purple-500/10 text-purple-400' },
            { href: '/inbox', label: 'Messages', icon: MessageCircle, color: 'bg-green-500/10 text-green-400', badge: unreadMessages },
        ] : []),
        ...(user?.role === 'ADMIN' ? [
            { href: '/admin', label: 'Admin Panel', icon: Shield, color: 'bg-yellow-400/10 text-black', adminStyle: true },
        ] : []),
    ];

    return (
        <motion.header
            initial={{ y: -100 }} animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-zinc-950/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] py-1' : 'bg-transparent py-4'}`}
        >
            <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 flex-shrink-0 z-50">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)] flex-shrink-0 transition-transform hover:scale-105">
                        <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    </div>
                    <span className="text-lg sm:text-xl font-black tracking-tighter text-white leading-none uppercase">BIDORA</span>
                </Link>

                {/* Search - Desktop */}
                <form onSubmit={e => { e.preventDefault(); const q = (e.currentTarget.querySelector('input') as HTMLInputElement).value; if (q) router.push(`/search?q=${encodeURIComponent(q)}`); }} className="hidden md:flex flex-1 max-w-md mx-6 lg:mx-10 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                    <input type="text" placeholder="Search sneakers, brands, sizes…"
                        className="w-full bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-full py-3 pl-11 pr-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:bg-zinc-900 focus:border-yellow-400/50 transition-all placeholder:text-gray-500" />
                </form>

                {/* Right Actions */}
                <div className="flex items-center gap-1 sm:gap-3">

                    {/* Live counter */}
                    <div className="hidden lg:flex items-center space-x-2 mr-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full whitespace-nowrap">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-[10px] font-black tracking-widest text-white uppercase">
                            <span className="text-yellow-400">₹4,23,000</span> bid today
                        </span>
                    </div>

                    {/* Mobile Search */}
                    <button onClick={() => { setMenuOpen(true); setTimeout(() => document.getElementById('mobile-search')?.focus(), 150); }} className="md:hidden p-2 text-gray-400 hover:text-white">
                        <Search className="w-5 h-5" />
                    </button>

                    {/* Notification Bell */}
                    {user && (
                        <div className="relative">
                            <HoverIcon>
                                <button
                                    onClick={() => setShowNotifs(!showNotifs)}
                                    className={`relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full ${showNotifs ? 'bg-white/10 text-white' : ''}`}
                                >
                                    <BellAnimated className="w-5 h-5" hasUnread={unread > 0} />
                                    {unread > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center"
                                        >
                                            {unread > 9 ? '9+' : unread}
                                        </motion.span>
                                    )}
                                </button>
                            </HoverIcon>

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
                                                        <BellAnimated className="w-8 h-8 text-zinc-700" />
                                                        <p className="text-zinc-500 text-xs font-bold mt-3">No notifications yet</p>
                                                    </div>
                                                ) : notifs.map(n => (
                                                    <div key={n.id} onClick={() => { markRead(n.id); if (n.referenceId) router.push(`/auctions/${n.referenceId}`); }} className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors flex gap-4 ${n.isRead ? 'opacity-60' : 'bg-yellow-400/5'}`}>
                                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                                            <NotifIcon type={n.type} />
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

                    {/* Inbox */}
                    {user && (
                        <HoverIcon>
                            <Link href="/inbox" onClick={() => setUnreadMessages(0)} className="relative p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/5 rounded-full hidden sm:flex items-center justify-center">
                                <MessageCircle className="w-5 h-5" />
                                {unreadMessages > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center"
                                    >
                                        {unreadMessages > 9 ? '9+' : unreadMessages}
                                    </motion.span>
                                )}
                            </Link>
                        </HoverIcon>
                    )}

                    {/* Orders (Buyers) */}
                    {user && user.role !== 'SELLER' && (
                        <Link href="/dashboard?tab=orders" className="hidden lg:flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
                            <ShoppingBag className="w-4 h-4 text-yellow-400" />
                            <span className="font-semibold text-sm">Orders</span>
                        </Link>
                    )}

                    {/* Analytics (Sellers) */}
                    {user?.role === 'SELLER' && (
                        <Link href="/analytics" className="hidden lg:flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
                            <ShoppingBag className="w-4 h-4 text-yellow-400" />
                            <span className="font-semibold text-sm">Analytics</span>
                        </Link>
                    )}

                    {/* Wallet */}
                    {user && (
                        <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10">
                            <Wallet className="w-4 h-4 text-yellow-400" />
                            <span className="font-semibold text-sm">₹{(user.walletBalance - user.pendingFunds).toLocaleString()}</span>
                        </Link>
                    )}

                    {/* Admin */}
                    {user?.role === 'ADMIN' && (
                        <Link href="/admin" className="hidden sm:flex items-center gap-1.5 text-black bg-yellow-400 hover:bg-yellow-300 transition-colors text-xs font-black px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                            <Shield className="w-4 h-4" /> ADMIN
                        </Link>
                    )}

                    {!user ? (
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                            <Link href="/auth" className="bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 px-5 py-2.5 rounded-full font-black text-sm transition-all shadow-[0_10px_30px_-10px_rgba(250,204,21,0.5)] border border-yellow-300 block">
                                Sign In
                            </Link>
                        </motion.div>
                    ) : (
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 text-sm font-semibold transition-colors hidden sm:block">
                            Log out
                        </button>
                    )}

                    {/* Mobile Menu Toggle */}
                    <motion.button
                        whileTap={{ scale: 0.85 }}
                        className="md:hidden p-2.5 text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all ml-1"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        <AnimatePresence mode="wait">
                            {menuOpen
                                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>
                            }
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] md:hidden"
                            onClick={() => setMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed right-0 top-0 bottom-0 w-[80%] max-w-xs bg-zinc-950 border-l border-white/10 z-[70] md:hidden shadow-[-30px_0_60px_rgba(0,0,0,0.6)] flex flex-col"
                        >
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Flame className="w-4 h-4 text-black" />
                                    </div>
                                    <span className="text-lg font-black tracking-tighter text-white leading-none uppercase">BIDORA</span>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => setMenuOpen(false)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </motion.button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto overscroll-contain">
                                {/* Mobile Search */}
                                <div className="p-4 border-b border-white/5">
                                    <form onSubmit={e => { e.preventDefault(); const q = (e.currentTarget.querySelector('input') as HTMLInputElement).value; if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); setMenuOpen(false); } }} className="relative">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input id="mobile-search" type="text" placeholder="Search sneakers…"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-yellow-400/50 transition-all placeholder:text-gray-600" />
                                    </form>
                                </div>

                                {/* Nav Links */}
                                <nav className="p-4 space-y-2">
                                    {navLinks.map((link, idx) => {
                                        const Icon = link.icon;
                                        return (
                                            <motion.div
                                                key={link.href}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 300 }}
                                            >
                                                <Link
                                                    href={link.href}
                                                    onClick={() => { setMenuOpen(false); if ('badge' in link) setUnreadMessages(0); }}
                                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.97] ${(link as any).adminStyle
                                                        ? 'bg-yellow-400 border-yellow-300 text-black font-black'
                                                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/10 text-gray-200 font-bold'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${(link as any).adminStyle ? 'bg-black/10' : link.color.split(' ').filter((c: string) => !c.startsWith('text-')).join(' ')}`}>
                                                        <Icon className={`w-5 h-5 ${(link as any).adminStyle ? 'text-black' : link.color.split(' ').find((c: string) => c.startsWith('text-'))}`} />
                                                    </div>
                                                    <span className="flex-1 text-base">{link.label}</span>
                                                    {'badge' in link && (link as any).badge > 0 && (
                                                        <motion.span
                                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className="w-5 h-5 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center"
                                                        >
                                                            {(link as any).badge > 9 ? '9+' : (link as any).badge}
                                                        </motion.span>
                                                    )}
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </nav>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/10 bg-white/[0.02] flex-shrink-0">
                                {!user ? (
                                    <Link href="/auth" onClick={() => setMenuOpen(false)} className="block bg-yellow-400 text-zinc-950 py-4 rounded-2xl font-black text-center shadow-[0_10px_30px_-10px_rgba(250,204,21,0.5)] active:scale-[0.98] transition-transform">
                                        Sign In to Bid
                                    </Link>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <motion.div
                                                whileHover={{ scale: 1.05 }}
                                                className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                                            >
                                                {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                            </motion.div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-bold truncate text-sm">{user.fullName}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <Wallet className="w-3 h-3 text-yellow-400" />
                                                    <p className="text-yellow-400 text-xs font-bold">₹{(user.walletBalance ?? 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            {user.verifiedStatus !== 'BASIC' && (
                                                <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                            )}
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => { handleLogout(); setMenuOpen(false); }}
                                            className="w-full text-red-400 py-3.5 font-bold text-sm border border-red-500/20 rounded-2xl hover:bg-red-500/5 active:scale-[0.98] transition-all"
                                        >
                                            Log Out
                                        </motion.button>
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
