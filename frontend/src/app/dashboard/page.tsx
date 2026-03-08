'use client';
// Dashboard UI Redesign - Red Theme & Structured Navigation
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame, ArrowRight, Wallet, Activity, Package,
    TrendingUp, Star, Bell, Shield, LogOut, Plus, BarChart3, PieChart, Filter,
    ChevronDown, ChevronLeft, ChevronRight, Trophy, Target, Zap, ShoppingBag, Tag,
    ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, Clock, ArrowDownCircle, AlertTriangle,
    FileText, Upload, UserCheck, BadgeCheck, X, ShieldCheck, Trash2, Hexagon
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';
// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';

// Cashfree instance
let cashfree: any = null;
const initCashfree = async () => {
    if (!cashfree) {
        cashfree = await load({ mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox' });
    }
    return cashfree;
};

// ── Types ──────────────────────────────────────────────────────────
interface Bid {
    id: string; amount: number; isWinning: boolean; createdAt: string;
    auction: { id: string; title: string; status: string; currentHighestBid: number; endTime: string; imageUrls: string[] };
}
interface Auction {
    id: string; title: string; status: string; currentHighestBid: number;
    endTime: string; imageUrls: string[]; bidCount: number; _count: { bids: number };
}
interface Tx {
    id: string; amount: number; type: string; status: string; description: string; createdAt: string;
}
interface Notification {
    id: string; title: string; body: string; isRead: boolean; type: string; createdAt: string;
}
interface VerificationRequest {
    id: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
    fullLegalName: string;
    businessType: string;
    description: string;
    adminNotes?: string;
    createdAt: string;
}

const statusColor: Record<string, string> = {
    LIVE: 'text-green-400 bg-green-400/10 border-green-400/20',
    ENDED: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    PAYMENT_PENDING: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    PAID: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    SHIPPED: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    COMPLETED: 'text-red-400 bg-red-400/10 border-red-400/20',
    DRAFT: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    SCHEDULED: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
};

// ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const { user, logout, refreshUser, loading: authLoading } = useAuth();
    const router = useRouter();

    // ── State ──
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    const [myBids, setMyBids] = useState<Bid[]>([]);
    const [myListings, setMyListings] = useState<Auction[]>([]);
    const [transactions, setTransactions] = useState<Tx[]>([]);
    const [txPage, setTxPage] = useState(1);
    const [txTotalPages, setTxTotalPages] = useState(1);
    const [txFilter, setTxFilter] = useState('');

    const [wallet, setWallet] = useState<{ walletBalance: number; pendingFunds: number; availableBalance: number } | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositing, setDepositing] = useState(false);
    const [depositMsg, setDepositMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [wonOrders, setWonOrders] = useState<any[]>([]);
    const [soldOrders, setSoldOrders] = useState<any[]>([]);

    const [analytics, setAnalytics] = useState<{
        totalSales: number;
        activeBidsReceiving: number;
        revenuePotential: number;
        recentSales: number;
        performance?: number[];
        sellerLevel?: { level: number; nextTier: number; progress: number; }
    } | null>(null);

    const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
    const [verificationForm, setVerificationForm] = useState({
        fullLegalName: '',
        businessType: 'individual',
        panNumber: '',
        aadhaarLast4: '',
        description: '',
        documentUrls: '',
        assetUrls: ''
    });
    const [submittingVerification, setSubmittingVerification] = useState(false);
    const [verificationMsg, setVerificationMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // ── Lifecycle ──
    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/auth'); return; }

        setLoading(true);
        const fetchBids = api.get('/auctions/my/bids').catch(() => ({ data: { bids: [] } }));
        const fetchListings = api.get('/auctions/my/listings').catch(() => ({ data: { auctions: [] } }));
        const fetchTxs = api.get(`/wallet/transactions?limit=10&page=${txPage}${txFilter ? `&type=${txFilter}` : ''}`).catch(() => ({ data: { transactions: [], pagination: { pages: 1 } } }));
        const fetchWallet = api.get('/wallet').catch(() => ({ data: { walletBalance: 0, pendingFunds: 0, availableBalance: 0 } }));
        const fetchNotifs = api.get('/notifications?limit=20').catch(() => ({ data: { notifications: [], unreadCount: 0 } }));
        const fetchOrders = api.get('/auctions/my/orders').catch(() => ({ data: { wonAuctions: [], soldAuctions: [] } }));
        const fetchAnalytics = user.role === 'SELLER' || user.verifiedStatus !== 'BASIC'
            ? api.get('/auctions/my/analytics').catch(() => ({ data: null }))
            : Promise.resolve({ data: null });

        Promise.all([fetchBids, fetchListings, fetchTxs, fetchWallet, fetchNotifs, fetchOrders, fetchAnalytics])
            .then(([bidsRes, listingsRes, txRes, walletRes, notifRes, ordersRes, analyticsRes]) => {
                setMyBids(bidsRes.data.bids || []);
                setMyListings(listingsRes.data.auctions || []);
                setTransactions(txRes.data.transactions || []);
                setTxTotalPages(txRes.data.pagination?.pages || 1);
                setWallet(walletRes.data);
                setNotifications(notifRes.data.notifications || []);
                setUnreadCount(notifRes.data.unreadCount || 0);
                setWonOrders(ordersRes.data.wonAuctions || []);
                setSoldOrders(ordersRes.data.soldAuctions || []);
                setAnalytics(analyticsRes.data);

                api.get('/verification/my-status').then(r => setVerificationRequest(r.data.request)).catch(() => { });
            })
            .catch(err => {
                console.error("Dashboard fetch error:", err);
                setPageError('Unable to load dashboard data. Please try again.');
            })
            .finally(() => setLoading(false));
    }, [user, authLoading, txPage, txFilter]);

    // ── Handlers ──
    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleDepositRequest = async () => {
        if (!depositAmount || Number(depositAmount) < 100) {
            setDepositMsg({ type: 'error', text: 'Minimum deposit is ₹100' });
            return;
        }
        setDepositing(true);
        setDepositMsg(null);
        try {
            const res = await api.post('/payments/create-order', { amount: Number(depositAmount) });
            const cf = await initCashfree();
            await cf.checkout({ paymentSessionId: res.data.paymentSessionId, returnUrl: `${window.location.origin}/dashboard?tab=finance&paid=true` });
        } catch (err: any) {
            setDepositMsg({ type: 'error', text: err.response?.data?.message || 'Payment initiation failed' });
        } finally {
            setDepositing(false);
        }
    };

    const handleWithdrawRequest = async () => {
        if (!withdrawAmount || Number(withdrawAmount) < 500) {
            setWithdrawMsg({ type: 'error', text: 'Minimum withdrawal is ₹500' });
            return;
        }
        if (wallet && Number(withdrawAmount) > wallet.availableBalance) {
            setWithdrawMsg({ type: 'error', text: 'Insufficient available balance' });
            return;
        }
        setWithdrawing(true);
        setWithdrawMsg(null);
        try {
            await api.post('/wallet/withdraw', { amount: Number(withdrawAmount) });
            setWithdrawMsg({ type: 'success', text: 'Withdrawal request submitted for review' });
            setWithdrawAmount('');
            const wRes = await api.get('/wallet'); setWallet(wRes.data);
            const tRes = await api.get(`/wallet/transactions?limit=10&page=${txPage}`); setTransactions(tRes.data.transactions);
        } catch (err: any) {
            setWithdrawMsg({ type: 'error', text: err.response?.data?.message || 'Withdrawal failed' });
        } finally {
            setWithdrawing(false);
        }
    };

    const handleSubmitVerification = async () => {
        setSubmittingVerification(true);
        setVerificationMsg(null);
        try {
            const res = await api.post('/verification/request', verificationForm);
            setVerificationMsg({ type: 'success', text: 'Identity documents submitted successfully' });
            setVerificationRequest(res.data.request);
        } catch (err: any) {
            setVerificationMsg({ type: 'error', text: err.response?.data?.message || 'Verification submission failed' });
        } finally {
            setSubmittingVerification(false);
        }
    };

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'documentUrls' | 'assetUrls') => {
        const files = e.target.files;
        if (!files) return;
        const formData = new FormData();
        Array.from(files).forEach(f => formData.append('files', f));
        try {
            const res = await api.post('/upload/multi', formData);
            const urls = res.data.urls.join('\n');
            setVerificationForm(prev => ({ ...prev, [field]: prev[field] ? prev[field] + '\n' + urls : urls }));
        } catch (err) {
            alert('File upload failed. Please try again.');
        }
    };

    // ── Navigation Structure ──
    const navCategories = [
        {
            title: 'Main',
            items: [
                { id: 'overview', label: 'My Hub', icon: Activity },
                { id: 'bids', label: 'Active Bids', icon: Target },
                { id: 'listings', label: 'My Listings', icon: Tag },
            ]
        },
        {
            title: 'Finance',
            items: [
                { id: 'finance', label: 'Wallet', icon: Wallet },
                { id: 'transactions', label: 'History', icon: FileText },
            ]
        },
        {
            title: 'Account',
            items: [
                { id: 'verify', label: user?.verifiedStatus !== 'BASIC' ? 'Verified' : 'Verify Identity', icon: BadgeCheck },
                { id: 'alerts', label: 'Alerts', icon: Bell, count: unreadCount },
                { id: 'analytics', label: 'Performance', icon: BarChart3 },
            ]
        }
    ];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Encrypted Data...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex overflow-hidden">
            {/* ── Sidebar Navigation (Desktop) ───────────────────────── */}
            <aside className="hidden lg:flex w-72 flex-col border-r border-white/[0.05] bg-zinc-900/50 backdrop-blur-xl shrink-0">
                <div className="p-8">
                    <Link href="/" className="group flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                            <Flame className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white">BIDORA</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto">
                    {navCategories.map((cat, idx) => (
                        <div key={idx} className="space-y-4">
                            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">{cat.title}</h3>
                            <div className="space-y-1">
                                {cat.items.map(item => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${isActive ? 'bg-red-600 text-white shadow-[0_10px_20px_-5px_rgba(220,38,38,0.4)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                        >
                                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                            {item.count && item.count > 0 && (
                                                <span className={`ml-auto px-2 py-0.5 rounded-lg text-[10px] font-black ${isActive ? 'bg-white text-red-600' : 'bg-red-600 text-white'}`}>
                                                    {item.count}
                                                </span>
                                            )}
                                            {isActive && (
                                                <motion.div layoutId="nav-acc" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/[0.05]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all group font-bold"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* ── Main Content Area ──────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen relative overflow-y-auto">
                {/* ── Header / Mobile Nav ── */}
                <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.05]">
                    <div className="px-4 lg:px-10 py-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-[0_10px_20px_-5px_rgba(220,38,38,0.4)] transition-transform hover:rotate-6">
                                    {user.fullName?.[0] || user.email?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-black tracking-tight text-white">Hey, {user.fullName?.split(' ')[0] || 'Member'} 👋</h1>
                                        <span className="px-2 py-0.5 bg-red-600/10 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-600/20">{user.role}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">Welcome back to your dashboard</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-white/[0.05]">
                                <div className="px-4 py-2">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Available Balance</p>
                                    <p className="text-xl font-black text-white">₹{wallet?.availableBalance.toLocaleString() || '0'}</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('finance')}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg hover:shadow-red-600/20 active:scale-95"
                                >
                                    TOP UP
                                </button>
                            </div>
                        </div>

                        {/* Mobile Tab Scroller */}
                        <div className="lg:hidden mt-8 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-2">
                            {navCategories.flatMap(c => c.items).map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`whitespace-nowrap flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white/5 text-gray-400  hover:bg-white/10'}`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* ── Tab Panels ────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="p-4 lg:p-10 max-w-7xl mx-auto w-full pb-20"
                    >
                        {/* Error Notification */}
                        {pageError && (
                            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <p className="text-red-400 font-bold text-sm">{pageError}</p>
                            </div>
                        )}

                        {/* ── Overview Hub ─────────────────────────────── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-12">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Portfolio', value: `₹${(wallet?.walletBalance || 0).toLocaleString()}`, icon: <Wallet />, color: 'red' },
                                        { label: 'Active Bids', value: myBids.length, icon: <Target />, color: 'blue' },
                                        { label: 'My Listings', value: myListings.length, icon: <Tag />, color: 'purple' },
                                        { label: 'Trust Level', value: user.verifiedStatus, icon: <ShieldCheck />, color: 'green' }
                                    ].map((stat, i) => (
                                        <div key={i} className="group bg-zinc-900/40 p-6 rounded-[2rem] border border-white/[0.05] hover:border-red-500/20 transition-all duration-500 hover:shadow-2xl overflow-hidden relative">
                                            <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] rounded-full opacity-10 bg-${stat.color}-500 group-hover:opacity-20 transition-opacity`} />
                                            <div className="relative">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-red-600 transition-all duration-500 group-hover:text-white">
                                                        {stat.icon}
                                                    </div>
                                                </div>
                                                <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">{stat.label}</p>
                                                <p className="text-3xl font-black text-white mt-1 tracking-tight">{stat.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid lg:grid-cols-3 gap-10">
                                    {/* Left Column - Active Bids */}
                                    <div className="lg:col-span-2 space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                                <Flame className="w-6 h-6 text-red-500" /> High-Stakes Activity
                                            </h2>
                                            <button onClick={() => setActiveTab('bids')} className="text-red-500 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-1 hover:gap-2 transition-all">
                                                View All <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {myBids.length === 0 ? (
                                                <div className="bg-zinc-900/20 border-2 border-dashed border-white/[0.05] rounded-[2.5rem] p-16 text-center group cursor-pointer hover:border-red-500/20 transition-all duration-500">
                                                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform">
                                                        <ShoppingBag className="w-10 h-10 text-gray-700" />
                                                    </div>
                                                    <h3 className="text-xl font-black text-white mb-2">No Active Bets</h3>
                                                    <p className="text-gray-500 max-w-sm mx-auto font-medium">You haven't placed any bids yet. Explore high-ticket auctions and claim your legacy.</p>
                                                    <Link href="/" className="inline-block mt-8 bg-white text-black px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Explore Marketplace</Link>
                                                </div>
                                            ) : myBids.slice(0, 3).map(bid => (
                                                <div key={bid.id} className="group bg-zinc-900/50 border border-white/[0.05] rounded-[2rem] p-5 flex items-center gap-6 hover:border-red-500/20 transition-all duration-500">
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 relative">
                                                        <Image src={bid.auction.imageUrls[0]} alt={bid.auction.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-white text-lg truncate tracking-tight">{bid.auction.title}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">My Bid</p>
                                                                <p className="text-red-500 font-black">₹{bid.amount.toLocaleString()}</p>
                                                            </div>
                                                            <div className="w-px h-8 bg-white/10" />
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Status</p>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${bid.isWinning ? 'text-green-400' : 'text-orange-400'}`}>
                                                                    {bid.isWinning ? 'Winning' : 'Outbid'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link href={`/auctions/${bid.auction.id}`} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition-all">
                                                        <ChevronRight className="w-6 h-6" />
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column - Status & Notifications */}
                                    <div className="space-y-8">
                                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                            <Bell className="w-6 h-6 text-red-500" /> Signals
                                        </h2>
                                        <div className="bg-zinc-900/50 border border-white/[0.05] rounded-[2.5rem] p-6 space-y-4">
                                            {notifications.slice(0, 5).map(n => (
                                                <button key={n.id} onClick={() => setActiveTab('alerts')} className="w-full group flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all text-left">
                                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.isRead ? 'bg-gray-800' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse'}`} />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">{n.title}</p>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.body}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            {notifications.length === 0 && <p className="text-center py-10 text-gray-600 font-bold uppercase tracking-widest text-[10px]">Zero Notifications</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Finance Tab ──────────────────────────────── */}
                        {activeTab === 'finance' && (
                            <div className="space-y-10">
                                <div className="grid md:grid-cols-2 gap-10">
                                    {/* Wallet Balance Card */}
                                    <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] rounded-full -mr-20 -mt-20" />
                                        <Activity className="absolute bottom-10 right-10 w-32 h-32 text-white/5 -rotate-12 pointer-events-none" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-80">Marketplace Identity Wallet</p>
                                        <div className="space-y-2">
                                            <p className="text-6xl font-black tracking-tighter">₹{wallet?.walletBalance.toLocaleString() || '0'}</p>
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 bg-white/10 rounded-lg flex items-center gap-2 border border-white/20">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">₹{wallet?.availableBalance.toLocaleString()} Available</span>
                                                </div>
                                                {wallet?.pendingFunds && wallet.pendingFunds > 0 ? (
                                                    <div className="px-3 py-1 bg-white/10 rounded-lg flex items-center gap-2 border border-white/20">
                                                        <div className="w-2 h-2 bg-orange-400 rounded-full" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-200">₹{wallet.pendingFunds.toLocaleString()} Pending</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="mt-12 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <p className="text-xs font-bold leading-relaxed max-w-[200px] opacity-80">Secured with AES-256 military encryption & 2FA transaction logic.</p>
                                        </div>
                                    </div>

                                    {/* Actions Card */}
                                    <div className="space-y-6">
                                        {/* Deposit */}
                                        <div className="bg-zinc-900 border border-white/[0.05] rounded-[2.5rem] p-8">
                                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                                <ArrowDownCircle className="w-6 h-6 text-red-500" /> Instant Deposit
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xl">₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter amount (min. 100)"
                                                        value={depositAmount}
                                                        onChange={e => setDepositAmount(e.target.value)}
                                                        className="w-full bg-zinc-950 border border-white/[0.1] rounded-2xl pl-10 pr-6 py-5 text-white font-black text-xl outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all"
                                                    />
                                                </div>
                                                {depositMsg && (
                                                    <p className={`text-xs font-bold ${depositMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{depositMsg.text}</p>
                                                )}
                                                <button
                                                    disabled={depositing}
                                                    onClick={handleDepositRequest}
                                                    className="w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-xl hover:shadow-red-600/20 active:scale-95 disabled:opacity-50"
                                                >
                                                    {depositing ? 'HANDSHAKING WITH GATEWAY...' : 'INSTANT RECHARGE via UPI/CARD'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Withdraw */}
                                        <div className="bg-zinc-900/50 border border-white/[0.05] rounded-[2.5rem] p-8">
                                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                                                <ArrowUpRight className="w-6 h-6 text-orange-500" /> High-Priority Payout
                                            </h3>
                                            <div className="flex gap-4">
                                                <input
                                                    type="number"
                                                    placeholder="500+"
                                                    value={withdrawAmount}
                                                    onChange={e => setWithdrawAmount(e.target.value)}
                                                    className="flex-1 bg-zinc-950 border border-white/[0.1] rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-white/20 transition-all"
                                                />
                                                <button
                                                    disabled={withdrawing}
                                                    onClick={handleWithdrawRequest}
                                                    className="bg-zinc-800 hover:bg-white hover:text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                                                >
                                                    {withdrawing ? 'INITIATING...' : 'WITHDRAW'}
                                                </button>
                                            </div>
                                            {withdrawMsg && <p className="mt-4 text-xs font-bold text-orange-400">{withdrawMsg.text}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Transaction History Tab ─────────────────────── */}
                        {activeTab === 'transactions' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <FileText className="w-6 h-6 text-red-500" /> Transaction Audit
                                    </h2>
                                    <select
                                        value={txFilter}
                                        onChange={e => { setTxFilter(e.target.value); setTxPage(1); }}
                                        className="bg-zinc-900 border border-white/[0.05] rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-400 outline-none"
                                    >
                                        <option value="">All Streams</option>
                                        <option value="DEPOSIT">Deposits</option>
                                        <option value="WITHDRAW">Withdrawals</option>
                                        <option value="BID_HOLD">Bid Holds</option>
                                        <option value="PURCHASE">Purchases</option>
                                    </select>
                                </div>

                                <div className="bg-zinc-900/40 border border-white/[0.05] rounded-[2.5rem] overflow-hidden">
                                    {transactions.length === 0 ? (
                                        <p className="py-20 text-center text-gray-600 font-bold uppercase tracking-[0.3em] text-[10px]">Registry is empty</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-white/[0.05]">
                                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Operation / ID</th>
                                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Date & Time</th>
                                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Type</th>
                                                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Quantum</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactions.map((tx, idx) => (
                                                        <tr key={tx.id} className={`group ${idx !== transactions.length - 1 ? 'border-b border-white/[0.03]' : ''} hover:bg-white/[0.02] transition-colors`}>
                                                            <td className="px-8 py-6">
                                                                <p className="font-black text-white tracking-tight">{tx.description}</p>
                                                                <p className="text-[10px] font-mono text-gray-600 mt-1 uppercase">#{tx.id.slice(-12)}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <p className="text-gray-400 font-bold text-sm">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                                                <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest mt-1">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                                        tx.status === 'PENDING' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                                            'bg-red-500/10 text-red-400 border border-red-500/20'
                                                                    }`}>
                                                                    {tx.type} | {tx.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-right">
                                                                <p className={`text-lg font-black ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Pagination */}
                                {txTotalPages > 1 && (
                                    <div className="flex items-center justify-center gap-6 pt-4">
                                        <button
                                            disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}
                                            className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/[0.05] flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Ledger {txPage} of {txTotalPages}</span>
                                        <button
                                            disabled={txPage === txTotalPages} onClick={() => setTxPage(p => p + 1)}
                                            className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/[0.05] flex items-center justify-center hover:bg-white/5 disabled:opacity-20 transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Seller Verification Tab ─────────────────────────── */}
                        {activeTab === 'verify' && (
                            <div className="space-y-12">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div>
                                        <p className="text-red-500 font-black uppercase tracking-[0.4em] text-[10px] mb-2">Trust & Authenticity</p>
                                        <h2 className="text-4xl font-black text-white tracking-tighter">Identity Verification</h2>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/[0.05] rounded-xl font-bold text-xs text-gray-500">
                                        Status: <span className={`uppercase tracking-widest ${user.verifiedStatus !== 'BASIC' ? 'text-green-400' : 'text-red-500'}`}>{user.verifiedStatus}</span>
                                    </div>
                                </div>

                                {/* Already Verified Block */}
                                {user.verifiedStatus !== 'BASIC' && (
                                    <div className="bg-gradient-to-br from-red-600/10 to-red-950/40 border border-red-500/20 rounded-[3rem] p-16 text-center relative overflow-hidden group shadow-3xl">
                                        <div className="absolute inset-0 bg-red-400/5 blur-[120px] rounded-full" />
                                        <CheckCircle2 className="w-24 h-24 text-red-500 mx-auto mb-8 animate-pulse" />
                                        <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">Credential Authenticated!</h3>
                                        <p className="text-gray-400 text-lg max-w-xl mx-auto leading-relaxed font-medium">Your account is fully verified. You have authorized clearance for high-ticket auctions, unlimited listings, and priority settlement logic.</p>
                                    </div>
                                )}

                                {/* Under Review / Submission Confirmation */}
                                {user.verifiedStatus === 'BASIC' && verificationRequest && verificationRequest.status !== 'REJECTED' && (
                                    <div className={`border rounded-[3rem] p-16 text-center shadow-3xl relative overflow-hidden group ${verificationRequest.status === 'UNDER_REVIEW' ? 'bg-blue-500/5 border-blue-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                                        <div className="text-7xl mb-10 group-hover:scale-110 transition-transform duration-500">
                                            {verificationRequest.status === 'UNDER_REVIEW' ? '🔍' : '⏳'}
                                        </div>
                                        <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">
                                            {verificationRequest.status === 'UNDER_REVIEW' ? 'Review Phase Active' : 'Vaulting Application...'}
                                        </h3>
                                        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10 font-medium">
                                            Application logged on <span className="text-white font-black">{new Date(verificationRequest.createdAt).toLocaleDateString()}</span>. Our compliance nodes are validating your digital footprint.
                                        </p>
                                        <span className={`px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm border ${verificationRequest.status === 'UNDER_REVIEW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {verificationRequest.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                )}

                                {/* Application Form */}
                                {user.verifiedStatus === 'BASIC' && (!verificationRequest || verificationRequest.status === 'REJECTED') && (
                                    <div className="space-y-12">
                                        {verificationRequest?.status === 'REJECTED' && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-[2.5rem] p-8 flex items-center gap-6">
                                                <XCircle className="w-12 h-12 text-red-500 shrink-0" />
                                                <div>
                                                    <h4 className="text-xl font-black text-white">Action Required</h4>
                                                    <p className="text-red-400/80 font-medium mt-1">Reason: "{verificationRequest.adminNotes || 'Information provided was insufficient.'}"</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/[0.05] rounded-[3rem] p-12 space-y-12">
                                            <div className="grid md:grid-cols-2 gap-10">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Identity Signature *</label>
                                                    <input
                                                        type="text" placeholder="Legal Full Name"
                                                        value={verificationForm.fullLegalName}
                                                        onChange={e => setVerificationForm(p => ({ ...p, fullLegalName: e.target.value }))}
                                                        className="w-full bg-zinc-950 border border-white/[0.08] rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-500 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Business Type *</label>
                                                    <select
                                                        value={verificationForm.businessType}
                                                        onChange={e => setVerificationForm(p => ({ ...p, businessType: e.target.value }))}
                                                        className="w-full bg-zinc-950 border border-white/[0.08] rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="individual">Individual Collector</option>
                                                        <option value="business">Registered Enterprise</option>
                                                        <option value="dealer">Professional Dealer</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Compliance ID (PAN) *</label>
                                                    <input
                                                        type="text" placeholder="ABCDE1234F"
                                                        value={verificationForm.panNumber}
                                                        onChange={e => setVerificationForm(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                                                        className="w-full bg-zinc-950 border border-white/[0.08] rounded-2xl px-6 py-4 text-white font-black tracking-widest outline-none focus:border-red-500 transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Aadhaar (Last 4) *</label>
                                                    <input
                                                        type="text" maxLength={4} placeholder="XXXX"
                                                        value={verificationForm.aadhaarLast4}
                                                        onChange={e => setVerificationForm(p => ({ ...p, aadhaarLast4: e.target.value.replace(/\D/g, '') }))}
                                                        className="w-full bg-zinc-950 border border-white/[0.08] rounded-2xl px-6 py-4 text-white font-black tracking-[0.5em] outline-none focus:border-red-500 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 ml-2">Legacy Portfolio Declaration *</label>
                                                <textarea
                                                    rows={4} placeholder="Briefly describe your specialization (Luxury sneakers, fine art, collectibles)..."
                                                    value={verificationForm.description}
                                                    onChange={e => setVerificationForm(p => ({ ...p, description: e.target.value }))}
                                                    className="w-full bg-zinc-950 border border-white/[0.08] rounded-3xl px-8 py-6 text-white font-medium outline-none focus:border-red-500 transition-all resize-none"
                                                />
                                            </div>

                                            {/* Document Vault Section */}
                                            <div className="bg-zinc-950/40 border border-white/[0.05] rounded-[2.5rem] p-10 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-2 h-full bg-red-600/50" />
                                                <div className="flex items-center gap-3 mb-8">
                                                    <ShieldCheck className="w-8 h-8 text-red-500" />
                                                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Document Vault</h3>
                                                </div>

                                                <div className="grid lg:grid-cols-2 gap-12">
                                                    {/* ID Proofs */}
                                                    <div className="space-y-6">
                                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <UserCheck className="w-4 h-4" /> Proof of Identity
                                                        </p>
                                                        <div className="flex flex-wrap gap-4">
                                                            {verificationForm.documentUrls.split('\n').filter(Boolean).map((url, i) => (
                                                                <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 group">
                                                                    <Image src={url} alt="ID" fill className="object-cover" />
                                                                    <button onClick={() => setVerificationForm(p => ({ ...p, documentUrls: p.documentUrls.split('\n').filter((_, idx) => idx !== i).join('\n') }))} className="absolute inset-0 bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                                        <Trash2 className="w-6 h-6 text-white" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all text-gray-600 hover:text-red-500">
                                                                <Plus className="w-6 h-6 mb-1" />
                                                                <span className="text-[8px] font-black uppercase">ADD ID</span>
                                                                <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleDocumentUpload(e, 'documentUrls')} />
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Asset Proofs */}
                                                    <div className="space-y-6">
                                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <Hexagon className="w-4 h-4" /> Provenance Proof (Asset Invoices)
                                                        </p>
                                                        <div className="flex flex-wrap gap-4">
                                                            {verificationForm.assetUrls.split('\n').filter(Boolean).map((url, i) => (
                                                                <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 group">
                                                                    <Image src={url} alt="Asset" fill className="object-cover" />
                                                                    <button onClick={() => setVerificationForm(p => ({ ...p, assetUrls: p.assetUrls.split('\n').filter((_, idx) => idx !== i).join('\n') }))} className="absolute inset-0 bg-red-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                                        <Trash2 className="w-6 h-6 text-white" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all text-gray-600 hover:text-red-500">
                                                                <Plus className="w-6 h-6 mb-1" />
                                                                <span className="text-[8px] font-black uppercase">ADD DOC</span>
                                                                <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleDocumentUpload(e, 'assetUrls')} />
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {verificationMsg && (
                                                <p className={`text-center py-6 rounded-2xl font-black text-sm border ${verificationMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {verificationMsg.text}
                                                </p>
                                            )}

                                            <button
                                                onClick={handleSubmitVerification}
                                                disabled={submittingVerification}
                                                className="w-full py-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-[2rem] text-xl shadow-2xl hover:shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {submittingVerification ? 'SEALING VAULT...' : 'ENCRYPT & SUBMIT APPLICATION'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid sm:grid-cols-3 gap-6">
                                    {[
                                        { title: 'Zero-Knowledge Privacy', desc: 'Your raw documents are never seen by third parties. They are hashed and processed through encrypted nodes.', icon: <Shield /> },
                                        { title: 'Fast-Track Review', desc: 'Our dedicated verification team reviews applications within 24 business hours for uninterrupted trading.', icon: <Clock /> },
                                        { title: 'Seller Tier-1 Access', desc: 'Removing identity caps unlocks unlimited listing capability and escrow-protected transfers.', icon: <Trophy /> }
                                    ].map((benefit, i) => (
                                        <div key={i} className="p-8 bg-zinc-900 border border-white/[0.05] rounded-[2rem] hover:border-red-500/20 transition-all">
                                            <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500 mb-6">{benefit.icon}</div>
                                            <p className="text-lg font-black text-white mb-2 tracking-tight">{benefit.title}</p>
                                            <p className="text-gray-500 text-sm font-medium leading-relaxed">{benefit.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Alerts/Signals Tab ────────────────────────── */}
                        {activeTab === 'alerts' && (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <Bell className="w-6 h-6 text-red-500" /> System Signals
                                    </h2>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-500 transition-colors">Mark all as read</button>
                                </div>

                                <div className="space-y-4">
                                    {notifications.length === 0 ? (
                                        <div className="py-32 text-center bg-zinc-900/40 rounded-[3rem] border border-white/[0.05]">
                                            <Bell className="w-16 h-16 text-gray-800 mx-auto mb-6" />
                                            <p className="text-gray-600 font-bold uppercase tracking-[0.3em] text-xs">No signals received</p>
                                        </div>
                                    ) : notifications.map(n => (
                                        <div key={n.id} className={`group bg-zinc-900/50 border rounded-[2rem] p-6 flex items-start gap-6 transition-all ${n.isRead ? 'border-white/[0.05] opacity-60' : 'border-red-500/30 bg-red-500/[0.02] shadow-[0_10px_30px_-15px_rgba(239,68,68,0.1)]'}`}>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 ${n.isRead ? 'bg-zinc-800 text-gray-500' : 'bg-red-600/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}>
                                                {n.type === 'AUCTION_WON' ? '🏆' : n.type === 'OUTBID' ? '🔔' : '💬'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className={`text-lg font-black tracking-tight ${n.isRead ? 'text-gray-300' : 'text-white'}`}>{n.title}</p>
                                                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-ping" />}
                                                </div>
                                                <p className={`mt-2 text-sm font-medium leading-relaxed ${n.isRead ? 'text-gray-500' : 'text-gray-400'}`}>{n.body}</p>
                                                <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                    <Clock className="w-3 h-3" /> {new Date(n.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Performance Tab ─────────────────────────── */}
                        {activeTab === 'analytics' && (
                            <div className="py-20 text-center space-y-6">
                                <BarChart3 className="w-24 h-24 text-red-500 mx-auto animate-pulse" />
                                <h3 className="text-3xl font-black text-white tracking-tighter">Advanced Performance Metrics</h3>
                                <p className="text-gray-500 max-w-sm mx-auto font-medium">We are currently aggregating high-frequency trading data for your account. Performance visualizations will be unlocked after your first confirmed sale.</p>
                                <div className="inline-flex items-center gap-2 px-6 py-2 bg-red-600/10 border border-red-500/20 rounded-full">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Live Backend Stream Active</span>
                                </div>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
