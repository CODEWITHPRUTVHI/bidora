'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, Package, Star, Zap, BarChart2, Award,
    ArrowUpRight, Loader2, ShoppingBag, Eye, MessageCircle,
    Clock, CheckCircle2, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';

interface Analytics {
    totalSales: number;
    activeBidsReceiving: number;
    revenuePotential: number;
    recentSales: number;
    performance: number[];
    sellerLevel: { level: number; nextTier: number; progress: number };
}

interface Listing {
    id: string;
    title: string;
    currentHighestBid: number;
    status: string;
    endTime: string;
    imageUrls: string[];
    _count: { bids: number };
    viewCount: number;
}

const LEVEL_CONFIG = [
    { label: 'Starter', icon: '🌱', color: 'from-gray-500 to-gray-600', glow: 'rgba(156,163,175,0.3)' },
    { label: 'Heat', icon: '🔥', color: 'from-orange-500 to-amber-600', glow: 'rgba(251,146,60,0.4)' },
    { label: 'Elite', icon: '⚡', color: 'from-blue-500 to-violet-600', glow: 'rgba(139,92,246,0.4)' },
    { label: 'Legend', icon: '👑', color: 'from-yellow-400 to-amber-500', glow: 'rgba(251,191,36,0.5)' },
];

const DAYS = ['6d ago', '5d ago', '4d ago', '3d ago', '2d ago', 'Yesterday', 'Today'];

const StatCard = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-zinc-900/60 border border-white/10 rounded-[1.5rem] p-6 group hover:border-white/20 transition-all"
    >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${color} opacity-5`} />
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
            {icon}
        </div>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-white">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </motion.div>
);

export default function SellerAnalyticsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) { router.push('/auth'); return; }
        if (user.role === 'BUYER') { router.push('/dashboard'); return; }

        Promise.all([
            api.get('/auctions/my/analytics'),
            api.get('/auctions/my/listings?limit=6')
        ]).then(([analyticsRes, listingsRes]) => {
            setAnalytics(analyticsRes.data);
            setListings(listingsRes.data.listings || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user, router]);

    if (loading || !analytics) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
        );
    }

    const lvlIdx = Math.max(0, Math.min(analytics.sellerLevel.level - 1, 3));
    const lvl = LEVEL_CONFIG[lvlIdx];
    const maxBar = Math.max(...analytics.performance, 1);

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <div className="container mx-auto px-4 md:px-8 py-12 max-w-7xl">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Seller Command Center</p>
                            <h1 className="text-4xl md:text-5xl font-black">
                                Your <span className="text-yellow-400">Analytics</span>
                            </h1>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/create-auction"
                                className="flex items-center gap-2 px-5 py-3 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                <Zap className="w-4 h-4" /> New Auction
                            </Link>
                            <Link href="/dashboard"
                                className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/10 font-bold rounded-2xl hover:bg-white/20 transition-all">
                                <BarChart2 className="w-4 h-4" /> Dashboard
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Seller Level Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className={`relative overflow-hidden rounded-[2rem] p-8 mb-8 border border-white/10`}
                    style={{ background: `radial-gradient(ellipse at 100% 50%, ${lvl.glow} 0%, transparent 70%), #18181b` }}
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${lvl.color} flex items-center justify-center text-4xl shadow-2xl flex-shrink-0`}>
                            {lvl.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <span className={`font-black text-2xl bg-gradient-to-r ${lvl.color} bg-clip-text text-transparent`}>
                                    {lvl.label} Seller
                                </span>
                                <span className="text-xs font-black bg-white/10 border border-white/10 px-3 py-1 rounded-full text-gray-300">
                                    LEVEL {analytics.sellerLevel.level}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${analytics.sellerLevel.progress}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                        className={`h-full rounded-full bg-gradient-to-r ${lvl.color}`}
                                    />
                                </div>
                                <span className="text-sm font-bold text-gray-400 whitespace-nowrap">
                                    ₹{analytics.totalSales.toLocaleString()} / ₹{analytics.sellerLevel.nextTier.toLocaleString()}
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs mt-2">
                                {analytics.sellerLevel.progress < 100 
                                    ? `₹${(analytics.sellerLevel.nextTier - analytics.totalSales).toLocaleString()} more in sales to reach the next level`
                                    : 'Maximum level reached! 🏆'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        icon={<DollarSign className="w-5 h-5 text-white" />}
                        label="Total Revenue" color="from-emerald-500 to-teal-600"
                        value={`₹${analytics.totalSales.toLocaleString()}`}
                        sub="All-time released escrow"
                    />
                    <StatCard
                        icon={<TrendingUp className="w-5 h-5 text-white" />}
                        label="Live Potential" color="from-blue-500 to-violet-600"
                        value={`₹${analytics.revenuePotential.toLocaleString()}`}
                        sub="Current live bids after fees"
                    />
                    <StatCard
                        icon={<Zap className="w-5 h-5 text-white" />}
                        label="Active Bids" color="from-yellow-400 to-amber-500"
                        value={analytics.activeBidsReceiving.toString()}
                        sub="Bids on your live auctions"
                    />
                    <StatCard
                        icon={<Package className="w-5 h-5 text-white" />}
                        label="Sales (7 Days)" color="from-pink-500 to-rose-600"
                        value={analytics.recentSales.toString()}
                        sub="Items sold this week"
                    />
                </div>

                {/* Performance Chart + Top Listings */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                    {/* Bid Activity Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="lg:col-span-3 bg-zinc-900/60 border border-white/10 rounded-[1.5rem] p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="font-black text-lg">Bid Activity</h2>
                                <p className="text-gray-500 text-xs">Bids received on your auctions — last 7 days</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Live
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="flex items-end justify-between gap-2 h-36">
                            {analytics.performance.map((val, i) => {
                                const heightPct = maxBar > 0 ? (val / maxBar) * 100 : 0;
                                const isToday = i === 6;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(heightPct, 4)}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                                            style={{ minHeight: '4px' }}
                                            className={`w-full rounded-xl ${isToday
                                                ? 'bg-gradient-to-t from-yellow-500 to-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                                                : 'bg-gradient-to-t from-white/10 to-white/20 hover:from-yellow-500/30 hover:to-yellow-300/30'
                                                } cursor-pointer transition-colors relative group`}
                                        >
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 border border-white/10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {val} bids
                                            </div>
                                        </motion.div>
                                        <span className={`text-[9px] font-bold ${isToday ? 'text-yellow-400' : 'text-gray-600'}`}>
                                            {isToday ? 'TODAY' : DAYS[i].split(' ')[0]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Quick Stats Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-2 bg-zinc-900/60 border border-white/10 rounded-[1.5rem] p-6 flex flex-col gap-4"
                    >
                        <h2 className="font-black text-lg">Quick Actions</h2>

                        {[
                            { icon: <Package className="w-4 h-4" />, label: 'My Listings', href: '/dashboard?tab=listings', count: null, color: 'text-blue-400' },
                            { icon: <ShoppingBag className="w-4 h-4" />, label: 'Orders & Shipments', href: '/dashboard?tab=orders', count: null, color: 'text-purple-400' },
                            { icon: <MessageCircle className="w-4 h-4" />, label: 'Messages', href: '/inbox', count: null, color: 'text-green-400' },
                            { icon: <Star className="w-4 h-4" />, label: 'My Reviews', href: '/dashboard?tab=ratings', count: null, color: 'text-yellow-400' },
                            { icon: <Award className="w-4 h-4" />, label: 'Verification', href: '/dashboard?tab=verify', count: null, color: 'text-pink-400' },
                        ].map((item) => (
                            <Link key={item.href} href={item.href}
                                className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group border border-transparent hover:border-white/10">
                                <span className={`${item.color}`}>{item.icon}</span>
                                <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors flex-1">{item.label}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                            </Link>
                        ))}

                        <div className="mt-auto pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Trust Score</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div key="trust-score" className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(user?.trustScore ?? 0 / 1) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`} />
                                    ))}
                                </div>
                                <span className="text-white font-black text-lg">{(user?.trustScore ?? 0).toFixed(1)}</span>
                                <span className="text-gray-500 text-xs">/ 5.0</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Active Listings */}
                {listings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-zinc-900/60 border border-white/10 rounded-[1.5rem] p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-black text-lg">Your Listings</h2>
                            <Link href="/dashboard?tab=listings" className="text-yellow-400 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                                View All <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {listings.map((listing) => {
                                const isLive = listing.status === 'LIVE';
                                const endDate = new Date(listing.endTime);
                                const diffMs = endDate.getTime() - Date.now();
                                const diffH = Math.floor(diffMs / 3600000);
                                const diffM = Math.floor((diffMs % 3600000) / 60000);
                                const timeLeft = diffMs > 0 ? (diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM}m`) : 'Ended';

                                return (
                                    <Link key={listing.id} href={`/auctions/${listing.id}`}
                                        className="flex gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] hover:border-white/10 transition-all group">
                                        <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0">
                                            {listing.imageUrls[0] ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={listing.imageUrls[0]} alt={listing.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">👟</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-white truncate group-hover:text-yellow-400 transition-colors">{listing.title}</p>
                                            <p className="text-yellow-400 font-black text-base">₹{Number(listing.currentHighestBid).toLocaleString()}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className={`flex items-center gap-1 text-[10px] font-bold ${isLive ? 'text-emerald-400' : 'text-gray-500'}`}>
                                                    {isLive ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE</> : <><CheckCircle2 className="w-3 h-3" /> {listing.status}</>}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                                    <Zap className="w-3 h-3" /> {listing._count.bids} bids
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] text-gray-500">
                                                    <Eye className="w-3 h-3" /> {listing.viewCount}
                                                </span>
                                                {isLive && (
                                                    <span className="flex items-center gap-1 text-[10px] text-orange-400 ml-auto">
                                                        <Clock className="w-3 h-3" /> {timeLeft}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Empty state for new sellers */}
                {listings.length === 0 && analytics.totalSales === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="border-2 border-dashed border-white/10 rounded-[2rem] p-16 text-center"
                    >
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-2xl font-black mb-2">Ready to Start Selling?</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">List your first sneaker auction and reach thousands of verified collectors on Bidora.</p>
                        <Link href="/create-auction"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 text-black font-black rounded-2xl hover:bg-yellow-300 transition-all shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                            <Zap className="w-5 h-5" /> Create Your First Auction
                        </Link>
                    </motion.div>
                )}

            </div>
        </div>
    );
}
