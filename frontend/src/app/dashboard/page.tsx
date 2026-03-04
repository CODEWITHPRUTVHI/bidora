'use client';
// Build trigger: 2026-03-02-v2
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Flame, ArrowRight, Wallet, Activity, Package,
    TrendingUp, Star, Bell, Shield, LogOut, Plus, BarChart3, PieChart, Filter,
    ChevronLeft, ChevronRight, Trophy, Target, Zap, ShoppingBag, Tag,
    ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, Clock, ArrowDownCircle, AlertTriangle,
    FileText, Upload, UserCheck, BadgeCheck
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/Skeleton';
// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';

// Cashfree is lazy loaded but we need the instance initialized
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
    COMPLETED: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    DRAFT: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    SCHEDULED: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
};

// ─────────────────────────────────────────────
export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const { user, logout, refreshUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const [myBids, setMyBids] = useState<Bid[]>([]);
    const [myListings, setMyListings] = useState<Auction[]>([]);
    const [transactions, setTransactions] = useState<Tx[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [wallet, setWallet] = useState<{ walletBalance: number; pendingFunds: number; availableBalance: number } | null>(null);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositing, setDepositing] = useState(false);
    const [depositMsg, setDepositMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [paymentSessionId, setPaymentSessionId] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawMsg, setWithdrawMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    // Pagination/Filters
    const [txPage, setTxPage] = useState(1);
    const [txTotalPages, setTxTotalPages] = useState(1);
    const [txFilter, setTxFilter] = useState('');
    const [analytics, setAnalytics] = useState<{ totalSales: number; activeBidsReceiving: number; revenuePotential: number; recentSales: number } | null>(null);
    const [wonOrders, setWonOrders] = useState<any[]>([]);
    const [soldOrders, setSoldOrders] = useState<any[]>([]);
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



    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/auth'); return; }

        setLoading(true);
        Promise.all([
            api.get('/auctions/my/bids'),
            api.get('/auctions/my/listings'),
            api.get(`/wallet/transactions?limit=10&page=${txPage}${txFilter ? `&type=${txFilter}` : ''}`),
            api.get('/wallet'),
            api.get('/notifications?limit=20'),
            api.get('/auctions/my/orders'),
            user.role === 'SELLER' || user.verifiedStatus !== 'BASIC' ? api.get('/auctions/my/analytics').catch(() => ({ data: null })) : Promise.resolve({ data: null })
        ]).then(([bidsRes, listingsRes, txRes, walletRes, notifRes, ordersRes, analyticsRes]) => {

            setMyBids(bidsRes.data.bids);
            setMyListings(listingsRes.data.auctions);
            setTransactions(txRes.data.transactions);
            setTxTotalPages(txRes.data.pagination?.pages || 1);
            setWallet(walletRes.data);
            setNotifications(notifRes.data.notifications);
            setWonOrders(ordersRes.data.wonAuctions);
            setSoldOrders(ordersRes.data.soldAuctions);
            setAnalytics(analyticsRes.data);
            // Fetch verification status separately
            api.get('/verification/my-status').then(r => setVerificationRequest(r.data.request)).catch(() => { });
        }).catch((err) => {
            console.error(err);
            setPageError('Connection lost. Please check your internet or try again later.');
        }).finally(() => setLoading(false));
    }, [user, authLoading, txPage, txFilter]);


    const handleDepositRequest = async () => {
        if (!depositAmount || Number(depositAmount) < 100) {
            setDepositMsg({ type: 'error', text: 'Minimum deposit is ₹100' });
            return;
        }
        setDepositing(true);
        setDepositMsg(null);
        try {
            // 1. Get Payment Session ID from our backend
            const res = await api.post('/payments/create-order', { amount: Number(depositAmount) });
            const sessionId = res.data.payment_session_id;
            const orderId = res.data.order_id;

            // 2. Initialize Cashfree Web SDK Dropin
            const cf = await initCashfree();
            let checkoutOptions = {
                paymentSessionId: sessionId,
                redirectTarget: "_modal",
            };

            // 3. Open Cashfree UI
            cf.checkout(checkoutOptions).then((result: any) => {
                if (result.error) {
                    setDepositMsg({ type: 'error', text: result.error.message || 'Payment failed or cancelled' });
                    setDepositing(false);
                }
                if (result.redirect) {
                    console.log('Payment will be redirected');
                }
                if (result.paymentDetails) {
                    // 4. Verify payment via backend
                    api.post('/payments/verify', { order_id: orderId }).then(() => {
                        setDepositMsg({ type: 'success', text: 'Deposit successful!' });
                        setDepositAmount('');
                        api.get('/wallet').then(res => setWallet(res.data));
                        api.get('/wallet/transactions?limit=10').then(res => setTransactions(res.data.transactions));
                        refreshUser();
                        setDepositing(false);
                    }).catch(err => {
                        setDepositMsg({ type: 'error', text: 'Payment verification failed.' });
                        setDepositing(false);
                    });
                }
            });

        } catch (e: any) {
            setDepositMsg({ type: 'error', text: e.response?.data?.error || 'Failed to initialize payment' });
            setDepositing(false);
        }
    };

    const handleWithdraw = async () => {
        const amt = Number(withdrawAmount);
        if (!amt || amt < 100) return setWithdrawMsg({ type: 'error', text: 'Minimum withdrawal is ₹100.' });
        if (amt > (wallet?.availableBalance || 0)) return setWithdrawMsg({ type: 'error', text: 'Insufficient balance.' });
        setWithdrawing(true);
        setWithdrawMsg(null);
        try {
            const res = await api.post('/wallet/withdraw', { amount: amt });
            setWithdrawMsg({
                type: 'success',
                text: res.data.message || `₹${amt.toLocaleString()} withdrawal initiated!`
            });
            setWithdrawAmount('');
            api.get('/wallet').then(res => setWallet(res.data));
            api.get('/wallet/transactions?limit=10').then(res => setTransactions(res.data.transactions));
            refreshUser();
        } catch (e: any) {
            setWithdrawMsg({ type: 'error', text: e.response?.data?.error || 'Withdrawal failed.' });
        } finally {
            setWithdrawing(false);
        }
    };

    const markAllRead = async () => {
        await api.patch('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleVerifySeller = async () => {
        // Redirect to the verification tab
        setActiveTab('verify');
    };

    const handleSubmitVerification = async () => {
        if (!verificationForm.fullLegalName.trim() || !verificationForm.description.trim()) {
            setVerificationMsg({ type: 'error', text: 'Full legal name and description are required.' });
            return;
        }
        setSubmittingVerification(true);
        setVerificationMsg(null);
        try {
            const docUrls = verificationForm.documentUrls.split('\n').map(u => u.trim()).filter(Boolean);
            const assetUrls = verificationForm.assetUrls.split('\n').map(u => u.trim()).filter(Boolean);
            const res = await api.post('/verification/apply', {
                ...verificationForm,
                documentUrls: docUrls,
                assetUrls: assetUrls
            });
            setVerificationRequest(res.data.request);
            setVerificationMsg({ type: 'success', text: 'Application submitted! An admin will review it within 24-48 hours.' });
        } catch (e: any) {
            setVerificationMsg({ type: 'error', text: e.response?.data?.error || 'Failed to submit application.' });
        } finally {
            setSubmittingVerification(false);
        }
    };

    const handleLogout = async () => { await logout(); router.push('/'); };

    if (!user || loading) return (
        <div className="container mx-auto px-4 md:px-8 py-24 max-w-7xl animate-fade-in">
            <div className="h-48 w-full bg-zinc-900/40 rounded-[2rem] border border-white/10 p-8 flex justify-between animate-pulse">
                <div className="space-y-4">
                    <div className="h-4 w-24 bg-zinc-800 rounded-full" />
                    <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
                    <div className="h-6 w-32 bg-zinc-800 rounded-full" />
                </div>
                <div className="w-32 h-16 bg-zinc-800 rounded-2xl" />
            </div>
            <div className="mt-8 flex gap-2 overflow-hidden">
                {[...Array(6)].map((_, i) => <div key={i} className="h-10 w-28 bg-zinc-900/60 rounded-xl flex-shrink-0" />)}
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
            </div>
            <div className="mt-8">
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        </div>
    );

    if (pageError) return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-xl font-black mb-2 text-white">Dashboard Offline</h2>
                <p className="text-sm opacity-80 mb-6">{pageError}</p>
                <button onClick={() => window.location.reload()} className="w-full bg-red-500/20 hover:bg-red-500/30 font-bold py-3 rounded-xl transition-all border border-red-500/30">
                    Retry Connection
                </button>
            </div>
        </div>
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const tabs = [
        { id: 'overview', label: 'Home', icon: Activity },
        { id: 'bids', label: 'Bids', icon: TrendingUp },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'tx', label: 'Ledger', icon: Clock },
        { id: 'orders', label: 'Wins', icon: Trophy },
        { id: 'listings', label: 'Sales', icon: Package },
        { id: 'analytics', label: 'Stats', icon: BarChart3 },
        { id: 'verify', label: user.verifiedStatus !== 'BASIC' ? 'Verified ✓' : 'Get Verified', icon: BadgeCheck },
        { id: 'notifs', label: `Alerts${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: Bell }
    ].filter(t => {
        if (t.id === 'analytics' && user.verifiedStatus === 'BASIC' && user.role !== 'SELLER') return false;
        return true;
    });


    return (
        <div className="container mx-auto px-3 sm:px-4 md:px-8 py-16 sm:py-24 max-w-7xl relative min-h-screen">
            <div className="absolute top-0 left-1/4 w-[40vw] h-[40vw] bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />




            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="w-full">
                    <p className="text-yellow-400 text-[10px] sm:text-sm font-black uppercase tracking-widest mb-1 sm:mb-2">Dashboard</p>
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-1 break-words">
                        Hey, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">{user.fullName?.split(' ')[0] || 'Bidder'}</span> 👋
                    </h1>
                    <div className="flex items-center flex-wrap gap-3 mt-3">
                        <span className="flex items-center text-yellow-400 text-sm bg-black/40 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(user.trustScore) ? 'fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-gray-600'}`} />
                            ))}
                            <span className="ml-2 font-bold text-white">{Number(user.trustScore).toFixed(1)}</span>
                        </span>

                        <span className={`flex items-center font-bold text-xs px-3 py-1.5 rounded-full border shadow-sm ${user.role === 'SELLER' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'}`}>
                            {user.role === 'SELLER' ? <Tag className="w-3.5 h-3.5 mr-1.5" /> : <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />}
                            {user.role}
                        </span>

                        {user.verifiedStatus !== 'BASIC' && (
                            <span className="flex items-center font-bold text-blue-400 text-xs bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Verified Seller
                            </span>
                        )}
                        {user.verifiedStatus === 'BASIC' && verificationRequest?.status === 'PENDING' && (
                            <span className="flex items-center font-bold text-orange-400 text-xs bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                                <Clock className="w-3.5 h-3.5 mr-1.5" /> Verification Pending
                            </span>
                        )}
                        {user.verifiedStatus === 'BASIC' && verificationRequest?.status === 'UNDER_REVIEW' && (
                            <span className="flex items-center font-bold text-blue-400 text-xs bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full">
                                <Shield className="w-3.5 h-3.5 mr-1.5" /> Under Review
                            </span>
                        )}
                        {user.verifiedStatus === 'BASIC' && (!verificationRequest || verificationRequest.status === 'REJECTED') && (
                            <button onClick={handleVerifySeller} className="flex items-center font-bold text-blue-400 text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-colors">
                                <Shield className="w-4 h-4 mr-1.5" /> {verificationRequest?.status === 'REJECTED' ? 'Reapply for Verification' : 'Get Verified Seller Status'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-6 md:mt-0 w-full md:w-auto">
                    <div className="flex-1 md:flex-none text-left bg-zinc-950/60 border border-white/10 rounded-2xl px-4 py-3 sm:py-4 shadow-inner min-w-0">
                        <p className="text-gray-400 text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Available Balance</p>
                        <p className="text-lg sm:text-3xl font-black text-white tracking-tight drop-shadow-md truncate">₹{(wallet?.availableBalance || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Tab Bar - Enhanced scroll for mobile */}
            <div className="flex flex-nowrap gap-1.5 bg-zinc-900/60 p-1.5 rounded-2xl border border-white/10 mb-8 w-full overflow-x-auto hide-scrollbar scroll-smooth snap-x">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-300 whitespace-nowrap snap-start ${activeTab === tab.id ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 shadow-[0_4px_15px_rgba(250,204,21,0.3)]' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >

                    {/* ── Overview ─────────────────────────────── */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                                {[
                                    { label: 'Bids Placed', value: myBids.length, color: 'text-yellow-400', icon: '🎯' },
                                    { label: 'Listings', value: myListings.filter(a => ['LIVE', 'SCHEDULED', 'DRAFT'].includes(a.status)).length, color: 'text-green-400', icon: '📦' },
                                    { label: 'Balance', value: `₹${(wallet?.walletBalance || 0).toLocaleString()}`, color: 'text-blue-400', icon: '💰' },
                                    { label: 'Alerts', value: unreadCount, color: 'text-orange-400', icon: '🔔' }
                                ].map(card => (
                                    <div key={card.label} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:-translate-y-1 transition-transform duration-300 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] cursor-default overflow-hidden">
                                        <p className="text-xl sm:text-3xl mb-1 sm:mb-3">{card.icon}</p>
                                        <p className={`text-xl sm:text-3xl md:text-4xl font-black ${card.color} tracking-tighter drop-shadow-md truncate`}>{card.value}</p>
                                        <p className="text-gray-500 text-[9px] sm:text-xs font-bold uppercase tracking-wider mt-1 sm:mt-2 truncate">{card.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)]">
                                <h3 className="font-black text-xl mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-yellow-400" /> Recent Activity</h3>
                                <div className="space-y-4">
                                    {myBids.slice(0, 3).map(bid => (
                                        <div key={bid.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-950/60 rounded-2xl border border-white/5 hover:border-yellow-400/20 transition-colors gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white/5 shadow-md">
                                                    <Image src={bid.auction.imageUrls[0] || ''} alt="" fill className="object-cover" sizes="56px" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm tracking-tight">{bid.auction.title}</p>
                                                    <p className="text-gray-500 text-xs mt-1">{new Date(bid.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center sm:flex-col justify-between sm:justify-center">
                                                <p className="text-yellow-400 font-black text-lg">₹{Number(bid.amount).toLocaleString()}</p>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border mt-1 shadow-sm ${statusColor[bid.auction.status] || 'text-gray-400'}`}>{bid.auction.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {myBids.length === 0 && <p className="text-gray-500 text-sm text-center py-6 bg-zinc-950/50 rounded-2xl border border-white/5">No activity yet. Start bidding!</p>}
                            </div>
                        </div>
                    )}

                    {/* ── My Bids ──────────────────────────────── */}
                    {activeTab === 'bids' && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-black mb-6 flex items-center"><TrendingUp className="w-6 h-6 mr-3 text-yellow-400" /> My Active Bids</h2>
                            {myBids.length === 0 ? (
                                <div className="text-center py-20 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-inner">
                                    <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <TrendingUp className="w-8 h-8 text-yellow-400" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">No Bids Placed Yet</h3>
                                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">You haven't participated in any auctions recently. Discover rare items and place your first bid!</p>
                                    <Link href="/" className="inline-flex items-center gap-2 bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold hover:bg-yellow-300 transition-colors shadow-[0_10px_20px_-10px_rgba(250,204,21,0.5)]">
                                        Explore Live Auctions <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : myBids.map(bid => (
                                <div key={bid.id} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:border-yellow-400/30 hover:shadow-[0_15px_30px_-15px_rgba(0,0,0,0.8)] transition-all duration-300 gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shadow-md">
                                            <Image src={bid.auction.imageUrls[0] || ''} alt="" fill className="object-cover" sizes="80px" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg tracking-tight mb-1">{bid.auction.title}</h3>
                                            <p className="text-gray-500 text-xs font-medium mb-3">Bid placed {new Date(bid.createdAt).toLocaleString()}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${statusColor[bid.auction.status] || 'text-gray-400'}`}>{bid.auction.status}</span>
                                                {bid.isWinning && <span className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(250,204,21,0.2)]">🏆 Winning</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-white/5 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Your Max Bid</p>
                                            <p className="text-3xl font-black text-yellow-400 drop-shadow-sm">₹{Number(bid.amount).toLocaleString()}</p>
                                        </div>
                                        <Link href={`/auctions/${bid.auction.id}`}
                                            className="text-sm font-bold text-black bg-white hover:bg-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors sm:mt-4 shadow-md">
                                            View Page <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Payments (Wallet) ─────────────────────── */}
                    {activeTab === 'wallet' && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Deposit Card */}
                                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-8 relative overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)]">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/10 blur-[80px] rounded-full pointer-events-none" />
                                    <Wallet className="w-8 h-8 text-yellow-400 mb-5 drop-shadow-md" />
                                    <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Available Balance</p>
                                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-md truncate">₹{(wallet?.availableBalance || 0).toLocaleString()}</h2>
                                    <p className="text-gray-500 text-[10px] sm:text-sm font-medium mb-6 sm:mb-8">Pending Escrow: ₹{(wallet?.pendingFunds || 0).toLocaleString()}</p>

                                    <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">Deposit Funds</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number" placeholder="Min ₹100"
                                            value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                                            className="flex-1 bg-zinc-950/50 border border-white/10 rounded-xl px-3 py-3 text-white text-sm font-bold outline-none focus:border-yellow-400/50 transition-all placeholder:text-gray-600 min-w-0"
                                        />
                                        <button onClick={handleDepositRequest} disabled={depositing}
                                            className="shrink-0 px-4 py-3 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg text-xs sm:text-sm whitespace-nowrap">
                                            {depositing ? <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                                            Deposit
                                        </button>
                                    </div>
                                    {depositMsg && (
                                        <p className={`mt-4 text-[11px] sm:text-sm font-bold px-4 py-3 rounded-xl transition-colors ${depositMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {depositMsg.text}
                                        </p>
                                    )}
                                </div>

                                {/* Withdraw Card */}
                                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-8 relative overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)]">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 blur-[80px] rounded-full pointer-events-none" />
                                    <ArrowDownCircle className="w-8 h-8 text-blue-400 mb-5 drop-shadow-md" />
                                    <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">Withdraw Balance</p>
                                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-md truncate">₹{(wallet?.availableBalance || 0).toLocaleString()}</h2>
                                    <p className="text-gray-500 text-[10px] sm:text-sm font-medium mb-6 sm:mb-8">Credited in 2-3 business days</p>

                                    <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3">Withdraw Amount</p>
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="number" placeholder="Min ₹100"
                                            value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                                            className="flex-1 bg-zinc-950/50 border border-white/10 rounded-xl px-3 py-3 text-white text-sm font-bold outline-none focus:border-blue-400/50 transition-all placeholder:text-gray-600 min-w-0"
                                        />
                                        <button onClick={handleWithdraw} disabled={withdrawing}
                                            className="shrink-0 px-4 py-3 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg text-xs sm:text-sm whitespace-nowrap">
                                            {withdrawing ? <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                                            Withdraw
                                        </button>
                                    </div>
                                    {withdrawMsg && (
                                        <p className={`mt-4 text-[11px] sm:text-sm font-bold px-4 py-3 rounded-xl transition-colors ${withdrawMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {withdrawMsg.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Ledger (New Tab) ───────────────────────── */}
                    {activeTab === 'tx' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                <h2 className="text-2xl font-black flex items-center"><Clock className="w-6 h-6 mr-3 text-yellow-400" /> Transaction Ledger</h2>
                                <div className="flex items-center gap-2 bg-zinc-900/60 p-1 rounded-xl border border-white/10">
                                    {['', 'DEPOSIT', 'WITHDRAWAL', 'ESCROW_HELD'].map(f => (
                                        <button key={f} onClick={() => { setTxFilter(f); setTxPage(1); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${txFilter === f ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                                            {f || 'All'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)]">
                                {transactions.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Filter className="w-8 h-8 text-gray-600" />
                                        </div>
                                        <p className="text-gray-500">No transactions found matching your filter.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/5">
                                                    <th className="pb-4 text-xs font-black text-gray-500 uppercase tracking-widest">Type</th>
                                                    <th className="pb-4 text-xs font-black text-gray-500 uppercase tracking-widest hidden md:table-cell">Date</th>
                                                    <th className="pb-4 text-xs font-black text-gray-500 uppercase tracking-widest lg:table-cell">Description</th>
                                                    <th className="pb-4 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {transactions.map(tx => (
                                                    <tr key={tx.id} className="group hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${Number(tx.amount) > 0 ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                                    {Number(tx.amount) > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                                </div>
                                                                <span className="font-bold text-sm text-white">{tx.type.replace('_', ' ')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-sm text-gray-500 hidden md:table-cell">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                        <td className="py-4 text-sm text-gray-400 lg:table-cell max-w-xs truncate">{tx.description}</td>
                                                        <td className={`py-4 text-right font-black ${Number(tx.amount) > 0 ? 'text-green-400' : 'text-white'}`}>
                                                            {Number(tx.amount) > 0 ? '+' : ''}₹{Math.abs(Number(tx.amount)).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {txTotalPages > 1 && (
                                    <div className="flex items-center justify-between mt-8 pt-8 border-t border-white/5">
                                        <p className="text-xs text-gray-500">Page {txPage} of {txTotalPages}</p>
                                        <div className="flex gap-2">
                                            <button disabled={txPage === 1} onClick={() => setTxPage(p => p - 1)}
                                                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button disabled={txPage === txTotalPages} onClick={() => setTxPage(p => p + 1)}
                                                className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Insights (New Tab) ──────────────────────── */}
                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black flex items-center"><BarChart3 className="w-6 h-6 mr-3 text-yellow-400" /> Seller Insights</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Earnings', value: `₹${analytics?.totalSales.toLocaleString()}`, icon: Trophy, color: 'text-yellow-400' },
                                    { label: 'Revenue Potential', value: `₹${analytics?.revenuePotential.toLocaleString()}`, icon: Target, color: 'text-blue-400', desc: 'Active bids - fees' },
                                    { label: 'Sales Velocity', value: analytics?.recentSales, icon: Zap, color: 'text-orange-400', desc: 'Last 7 days' },
                                    { label: 'Total Listings', value: myListings.length, icon: Package, color: 'text-purple-400' }
                                ].map((item, i) => (
                                    <div key={i} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg">
                                        <item.icon className={`w-8 h-8 ${item.color} mb-4`} />
                                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">{item.label}</p>
                                        <p className="text-3xl font-black text-white mt-1">{item.value}</p>
                                        {item.desc && <p className="text-[10px] text-gray-600 font-bold mt-1">{item.desc}</p>}
                                    </div>
                                ))}
                            </div>

                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
                                    <h3 className="font-black text-xl mb-6">Performance Trend</h3>
                                    <div className="h-64 flex items-end justify-between gap-2 px-2">
                                        {[40, 60, 45, 90, 65, 80, 100].map((h, i) => (
                                            <div key={i} className="flex-1 space-y-2 group">
                                                <div className="relative h-full flex items-end">
                                                    <motion.div
                                                        initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                                        className="w-full bg-gradient-to-t from-yellow-400/20 to-yellow-400 rounded-lg group-hover:to-yellow-300 transition-all cursor-pointer relative"
                                                    >
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] px-1.5 py-0.5 rounded font-black opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {h}%
                                                        </div>
                                                    </motion.div>
                                                </div>
                                                <p className="text-center text-[10px] text-gray-600 font-bold">D{i + 1}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-center text-xs text-gray-500 mt-6 font-medium italic">Showing platform engagement score relative to your listings over last 7 days.</p>
                                </div>

                                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
                                    <h3 className="font-black text-xl mb-6">Audience Interest</h3>
                                    <div className="space-y-6">
                                        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-bold text-gray-400">Winning Bids</span>
                                                <span className="text-sm font-black text-yellow-400">{myListings.filter(a => a.status === 'PAID' || a.status === 'SHIPPED').length}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-yellow-400" style={{ width: '65%' }} />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-bold text-gray-400">Total Views</span>
                                                <span className="text-sm font-black text-blue-400">1.2K</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-400" style={{ width: '80%' }} />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/5">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-bold text-gray-400">Conversion Rate</span>
                                                <span className="text-sm font-black text-green-400">8.4%</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-green-400" style={{ width: '40%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Orders ────────────────────────────────── */}
                    {activeTab === 'orders' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black flex items-center"><Trophy className="w-6 h-6 mr-3 text-yellow-400" /> Winner's Circle</h2>

                            <div className="space-y-8">
                                {/* Won Orders */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-400 mb-4 px-2 uppercase tracking-widest text-xs">Items You Won</h3>
                                    <div className="space-y-4">
                                        {wonOrders.length === 0 ? (
                                            <div className="text-center py-12 bg-zinc-950/40 rounded-[2rem] border border-white/5">
                                                <p className="text-gray-500 font-medium italic">No won auctions yet.</p>
                                            </div>
                                        ) : wonOrders.map(order => (
                                            <div key={order.id} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:border-yellow-400/30 transition-all gap-4">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shadow-md">
                                                        <Image src={order.imageUrls[0] || ''} alt="" fill className="object-cover" sizes="80px" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white text-lg tracking-tight mb-1">{order.title}</h3>
                                                        <p className="text-gray-500 text-xs font-medium mb-3">Seller: {order.seller.fullName}</p>
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${statusColor[order.status] || 'text-gray-400'}`}>{order.status}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                                                    <p className="text-2xl font-black text-white">₹{Number(order.currentHighestBid).toLocaleString()}</p>
                                                    <Link href={`/orders/${order.id}`} className="text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 px-6 py-2.5 rounded-xl transition-colors shadow-lg">
                                                        Track Order
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sold Orders */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-400 mb-4 px-2 uppercase tracking-widest text-xs">Items You Sold</h3>
                                    <div className="space-y-4">
                                        {soldOrders.length === 0 ? (
                                            <div className="text-center py-12 bg-zinc-950/40 rounded-[2rem] border border-white/5">
                                                <p className="text-gray-500 font-medium italic">No items sold yet.</p>
                                            </div>
                                        ) : soldOrders.map(order => {
                                            const winner = order.bids.find((b: any) => b.isWinning)?.bidder;
                                            return (
                                                <div key={order.id} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:border-green-400/30 transition-all gap-4">
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shadow-md">
                                                            <Image src={order.imageUrls[0] || ''} alt="" fill className="object-cover" sizes="80px" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-white text-lg tracking-tight mb-1">{order.title}</h3>
                                                            <p className="text-gray-500 text-xs font-medium mb-3">Buyer: {winner?.fullName || 'Winner'}</p>
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border shadow-sm ${statusColor[order.status] || 'text-gray-400'}`}>{order.status}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                                                        <p className="text-2xl font-black text-white">₹{Number(order.currentHighestBid).toLocaleString()}</p>
                                                        <Link href={`/orders/${order.id}`} className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl transition-colors shadow-sm">
                                                            Manage Sale
                                                        </Link>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Listings ─────────────────────────────── */}
                    {activeTab === 'listings' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black flex items-center"><Package className="w-6 h-6 mr-3 text-yellow-400" /> My Listings</h2>
                                <Link href="/create-auction"
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-colors shadow-lg">
                                    <Plus className="w-4 h-4" /> New Auction
                                </Link>
                            </div>
                            {myListings.length === 0 ? (
                                <div className="text-center py-20 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-inner">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Package className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Got Rare Items?</h3>
                                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">Turn your collectibles into cash securely. Escrow handles the money, you handle the shipping.</p>
                                    <Link href="/create-auction"
                                        className="inline-flex items-center gap-2 bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 px-6 py-3 border border-yellow-300 rounded-xl font-black hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(250,204,21,0.5)]">
                                        Create Your First Auction <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : myListings.map(auction => (
                                <div key={auction.id} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:border-white/20 hover:shadow-[0_15px_30px_-15px_rgba(0,0,0,0.8)] transition-all duration-300 gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-zinc-800 shadow-md">
                                            <Image src={auction.imageUrls[0] || ''} alt="" fill className="object-cover" sizes="80px" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg tracking-tight mb-1">{auction.title}</h3>
                                            <p className="text-gray-500 text-xs font-medium mb-3">{auction._count?.bids || 0} active bids · Ends {new Date(auction.endTime).toLocaleDateString()}</p>
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md border inline-block shadow-sm ${statusColor[auction.status] || ''}`}>{auction.status}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-white/5 sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Highest Bid</p>
                                            <p className="text-2xl font-black text-white">₹{Number(auction.currentHighestBid).toLocaleString()}</p>
                                        </div>
                                        <Link href={`/auctions/${auction.id}`} className="text-xs font-bold text-black bg-yellow-400 hover:bg-yellow-300 px-4 py-2 rounded-lg flex items-center justify-end gap-2 mt-2 sm:mt-3 transition-colors shadow-sm">
                                            Manage <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Notifications ────────────────────────── */}
                    {activeTab === 'notifs' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black flex items-center"><Bell className="w-6 h-6 mr-3 text-yellow-400" /> Notifications</h2>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} className="text-sm font-bold text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <div className="text-center py-20 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-inner">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Bell className="w-8 h-8 text-gray-500" />
                                    </div>
                                    <p className="text-gray-400 font-medium">You're all caught up! No new notifications.</p>
                                </div>
                            ) : notifications.map(n => (
                                <div key={n.id} className={`border rounded-3xl p-5 transition-all duration-300 ${n.isRead ? 'bg-zinc-900/40 backdrop-blur-xl border-white/10 hover:border-white/20' : 'bg-gradient-to-r from-yellow-400/10 to-transparent border-yellow-400/30'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${n.isRead ? 'bg-white/5' : 'bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.2)]'}`}>
                                            {
                                                n.type === 'AUCTION_WON' ? '🏆' :
                                                    n.type === 'OUTBID' ? '🔔' :
                                                        n.type === 'PAYMENT_REQUIRED' ? '💳' :
                                                            n.type === 'ITEM_SHIPPED' ? '📦' :
                                                                n.type === 'DISPUTE_OPENED' ? '⚠️' : '💬'
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <div className="flex items-start justify-between gap-4">
                                                <p className={`font-black tracking-tight text-base ${n.isRead ? 'text-white' : 'text-yellow-400'}`}>{n.title}</p>
                                                {!n.isRead && <span className="flex h-3 w-3 relative flex-shrink-0 mt-1">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                                </span>}
                                            </div>
                                            <p className={`text-sm mt-1 leading-relaxed ${n.isRead ? 'text-gray-400' : 'text-gray-300'}`}>{n.body}</p>
                                            <p className="text-gray-600 text-[11px] font-bold uppercase tracking-wider mt-3">{new Date(n.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Seller Verification ─────────────────────── */}
                    {activeTab === 'verify' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black flex items-center"><BadgeCheck className="w-6 h-6 mr-3 text-yellow-400" /> Seller Verification</h2>

                            {/* Already verified */}
                            {user.verifiedStatus !== 'BASIC' && (
                                <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-3xl p-8 text-center">
                                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-2xl font-black text-white mb-2">You are a {user.verifiedStatus === 'PREMIUM' ? '⭐ Premium' : '✅ Verified'} Seller!</h3>
                                    <p className="text-gray-400">You can create and list auctions. Your buyer trust score is actively tracked.</p>
                                </div>
                            )}

                            {/* Pending / Under Review */}
                            {user.verifiedStatus === 'BASIC' && verificationRequest && verificationRequest.status !== 'REJECTED' && (
                                <div className={`border rounded-3xl p-8 text-center ${verificationRequest.status === 'UNDER_REVIEW'
                                        ? 'bg-blue-500/5 border-blue-500/20'
                                        : 'bg-orange-500/5 border-orange-500/20'
                                    }`}>
                                    <div className="text-5xl mb-4">{verificationRequest.status === 'UNDER_REVIEW' ? '🔍' : '⏳'}</div>
                                    <h3 className="text-2xl font-black text-white mb-2">
                                        {verificationRequest.status === 'UNDER_REVIEW' ? 'Under Admin Review' : 'Application Pending'}
                                    </h3>
                                    <p className="text-gray-400 mb-4">Your application was submitted on {new Date(verificationRequest.createdAt).toLocaleDateString()}. Our team reviews within 24–48 hours.</p>
                                    <div className="flex items-center justify-center gap-3 text-sm">
                                        <span className={`px-4 py-2 rounded-full font-bold border ${verificationRequest.status === 'UNDER_REVIEW'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                                : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                                            }`}>{verificationRequest.status.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Rejected - show reason then allow reapply */}
                            {user.verifiedStatus === 'BASIC' && verificationRequest?.status === 'REJECTED' && (
                                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 mb-4">
                                    <div className="flex items-start gap-4">
                                        <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-black text-white mb-1">Previous Application Rejected</h4>
                                            <p className="text-red-300 text-sm">{verificationRequest.adminNotes || 'Your application did not meet our requirements.'}</p>
                                            <p className="text-gray-500 text-xs mt-2">You can reapply with better documentation below.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Application Form */}
                            {user.verifiedStatus === 'BASIC' && (!verificationRequest || verificationRequest.status === 'REJECTED') && (
                                <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                                    <div>
                                        <h3 className="font-black text-xl text-white mb-1">Apply for Seller Verification</h3>
                                        <p className="text-gray-400 text-sm">Complete this form to request seller access. Our admin team will review your documents within 24–48 hours.</p>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Full Legal Name *</label>
                                            <input
                                                type="text" placeholder="As shown on your ID"
                                                value={verificationForm.fullLegalName}
                                                onChange={e => setVerificationForm(p => ({ ...p, fullLegalName: e.target.value }))}
                                                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-yellow-400/50 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Account Type *</label>
                                            <select
                                                value={verificationForm.businessType}
                                                onChange={e => setVerificationForm(p => ({ ...p, businessType: e.target.value }))}
                                                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-yellow-400/50 transition-all"
                                            >
                                                <option value="individual">Individual Seller</option>
                                                <option value="business">Registered Business</option>
                                                <option value="dealer">Antique / Art Dealer</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">PAN Number</label>
                                            <input
                                                type="text" placeholder="ABCDE1234F"
                                                value={verificationForm.panNumber}
                                                onChange={e => setVerificationForm(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                                                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-yellow-400/50 transition-all font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Aadhaar Last 4 Digits</label>
                                            <input
                                                type="text" placeholder="XXXX" maxLength={4}
                                                value={verificationForm.aadhaarLast4}
                                                onChange={e => setVerificationForm(p => ({ ...p, aadhaarLast4: e.target.value.replace(/\D/g, '') }))}
                                                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-yellow-400/50 transition-all font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">What do you plan to sell? *</label>
                                        <textarea
                                            rows={3} placeholder="Describe the types of items you plan to list (e.g., vintage watches, rare books, artwork)…"
                                            value={verificationForm.description}
                                            onChange={e => setVerificationForm(p => ({ ...p, description: e.target.value }))}
                                            className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-yellow-400/50 transition-all resize-none"
                                        />
                                    </div>

                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                                        <p className="text-blue-400 text-xs font-black uppercase tracking-widest mb-3">📎 Document Upload Instructions</p>
                                        <p className="text-gray-400 text-sm leading-relaxed mb-3">
                                            Please upload your documents to any file hosting service (Google Drive, Dropbox, imgur, etc.) and paste the <strong className="text-white">public shareable links</strong> below — one link per line.
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">ID Proof Links (Aadhaar / PAN / Passport)</label>
                                                <textarea
                                                    rows={3} placeholder="https://drive.google.com/...\nhttps://drive.google.com/..."
                                                    value={verificationForm.documentUrls}
                                                    onChange={e => setVerificationForm(p => ({ ...p, documentUrls: e.target.value }))}
                                                    className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-blue-400/50 transition-all resize-none font-mono"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Asset / Ownership Proof Links</label>
                                                <textarea
                                                    rows={3} placeholder="https://drive.google.com/...\nhttps://drive.google.com/..."
                                                    value={verificationForm.assetUrls}
                                                    onChange={e => setVerificationForm(p => ({ ...p, assetUrls: e.target.value }))}
                                                    className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs outline-none focus:border-blue-400/50 transition-all resize-none font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {verificationMsg && (
                                        <p className={`text-sm font-bold px-4 py-3 rounded-xl border ${verificationMsg.type === 'success'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}>{verificationMsg.text}</p>
                                    )}

                                    <button
                                        onClick={handleSubmitVerification}
                                        disabled={submittingVerification}
                                        className="w-full py-4 bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 font-black rounded-2xl hover:-translate-y-0.5 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(250,204,21,0.5)] disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2 text-base"
                                    >
                                        {submittingVerification
                                            ? <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Submitting…</>
                                            : <><BadgeCheck className="w-5 h-5" /> Submit Verification Application</>
                                        }
                                    </button>
                                </div>
                            )}

                            {/* Info cards */}
                            <div className="grid sm:grid-cols-3 gap-4">
                                {[
                                    { icon: '🔒', title: 'Secure KYC', desc: 'Your documents are reviewed only by our verified admin team and are never shared.' },
                                    { icon: '⚡', title: '24-48 Hours', desc: 'Fast review process. Most applications are reviewed by the next business day.' },
                                    { icon: '🏆', title: 'Unlock Selling', desc: 'Once verified, you can list unlimited auctions and receive payouts directly to your bank.' }
                                ].map((item, i) => (
                                    <div key={i} className="bg-zinc-900/40 border border-white/10 rounded-2xl p-5">
                                        <p className="text-3xl mb-3">{item.icon}</p>
                                        <p className="font-black text-white mb-1">{item.title}</p>
                                        <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
