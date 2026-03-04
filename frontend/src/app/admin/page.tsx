'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Package, AlertTriangle, BarChart3, CheckCircle2,
    XCircle, Search, Shield, TrendingUp, Clock, Eye, Wallet, BadgeCheck
} from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Stats { totalUsers: number; totalAuctions: number; liveAuctions: number; totalRevenue: number; openDisputes: number; flaggedUsers: number; pendingWithdrawals: number }
interface User { id: string; fullName: string; email: string; role: string; verifiedStatus: string; isSuspended: boolean; suspiciousFlags: number; trustScore: number; walletBalance: number; createdAt: string; _count: { auctionsAsSeller: number; bidsPlaced: number } }
interface Dispute { id: string; auctionId: string; buyerId: string; reason: string; status: string; createdAt: string; auction: { id: string; title: string; currentHighestBid: number; sellerId: string }; buyer: { fullName: string; email: string; trustScore: number }; evidenceUrls?: string[]; adminNotes?: string | null; resolvedById?: string | null }
interface AdminAuction { id: string; title: string; currentHighestBid: number; startingPrice: number; status: string; createdAt: string; endTime: string; seller: { id: string; fullName: string; email: string }; category: { name: string }; _count: { bids: number }; }
interface AdminWithdrawal { id: string; userId: string; amount: number; description: string; createdAt: string; user: { fullName: string; email: string; trustScore: number; suspiciousFlags: number; verifiedStatus: string } }
interface VerificationReq {
    id: string; fullLegalName: string; businessType: string; panNumber?: string; aadhaarLast4?: string;
    description: string; documentUrls: string[]; assetUrls: string[]; status: string; createdAt: string;
    user: { id: string; fullName: string; email: string; role: string; trustScore: number; createdAt: string; _count: { auctionsAsSeller: number; bidsPlaced: number } };
}

const tabList = [
    { id: 'stats', label: 'Dashboard', icon: BarChart3 },
    { id: 'verifications', label: 'Verifications', icon: BadgeCheck },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'disputes', label: 'Disputes', icon: AlertTriangle },
    { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    { id: 'auctions', label: 'Auctions', icon: Package }
];

export default function AdminPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState('stats');
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [auctions, setAuctions] = useState<AdminAuction[]>([]);
    const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
    const [verifications, setVerifications] = useState<VerificationReq[]>([]);
    const [verificationFilter, setVerificationFilter] = useState<'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        if (!user) { router.push('/auth'); return; }
        if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }

        Promise.all([
            api.get('/admin/stats'),
            api.get('/admin/users?limit=50'),
            api.get('/disputes/admin'),
            api.get('/admin/auctions?limit=50'),
            api.get('/admin/withdrawals'),
            api.get('/verification/admin/pending?status=PENDING')
        ]).then(([s, u, d, a, w, v]) => {
            setStats({ ...s.data, pendingWithdrawals: w.data.withdrawals.length });
            setUsers(u.data.users);
            setDisputes(d.data.disputes);
            setAuctions(a.data.auctions);
            setWithdrawals(w.data.withdrawals);
            setVerifications(v.data.requests);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user]);

    const handleSuspend = async (userId: string, suspend: boolean) => {
        await api.patch(`/admin/users/${userId}/suspend`, { suspend, reason: 'Admin action' });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: suspend } : u));
    };

    const handleVerify = async (userId: string, verifiedStatus: string) => {
        await api.patch(`/admin/users/${userId}/verify`, { verifiedStatus });
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, verifiedStatus } : u));
    };

    const handleVerificationReview = async (id: string, decision: 'APPROVED' | 'REJECTED', adminNotes?: string) => {
        setResolving(id);
        try {
            await api.patch(`/verification/admin/${id}/review`, { decision, adminNotes });
            setVerifications(prev => prev.filter(v => v.id !== id));
        } catch (e: any) {
            alert(e.response?.data?.error || 'Failed to review verification');
        } finally {
            setResolving(null);
        }
    };

    const resolveDispute = async (disputeId: string, decision: string) => {
        setResolving(disputeId);
        try {
            await api.patch(`/disputes/${disputeId}/resolve`, { decision, adminNote });
            setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status: 'RESOLVED' } : d));
            setAdminNote('');
        } catch (e: any) { alert(e.response?.data?.error || 'Failed'); }
        finally { setResolving(null); }
    };

    const filteredUsers = users.filter(u =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const filteredAuctions = auctions.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.seller.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleRemoveAuction = async (auctionId: string) => {
        const reason = prompt('Enter reason for removing this auction:');
        if (!reason) return;

        setResolving(auctionId);
        try {
            await api.delete(`/admin/auctions/${auctionId}`, { data: { reason } });
            setAuctions(prev => prev.map(a => a.id === auctionId ? { ...a, status: 'CANCELLED' } : a));
        } catch (e: any) { alert(e.response?.data?.error || 'Failed to remove auction'); }
        finally { setResolving(null); }
    };

    const handleWithdrawal = async (txId: string, action: 'approve' | 'reject') => {
        let reason = '';
        if (action === 'reject') {
            reason = prompt('Enter reason for rejecting this withdrawal:') || '';
            if (!reason) return; // Cancelled
        }

        setResolving(txId);
        try {
            await api.post(`/admin/withdrawals/${txId}/${action}`, { reason });
            setWithdrawals(prev => prev.filter(w => w.id !== txId));
            setStats(prev => prev ? { ...prev, pendingWithdrawals: prev.pendingWithdrawals - 1 } : null);
        } catch (e: any) { alert(e.response?.data?.error || `Failed to ${action} withdrawal`); }
        finally { setResolving(null); }
    };

    if (!user || loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-7xl">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-7 h-7 text-yellow-400" />
                    <h1 className="text-4xl font-black tracking-tighter">Admin <span className="text-yellow-400">Control Panel</span></h1>
                </div>
                <p className="text-gray-400">Manage users, disputes, and platform health.</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-white/5 border border-white/10 p-2 rounded-2xl mb-8">
                {tabList.map(t => {
                    const Icon = t.icon;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t.id ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}>
                            <Icon className="w-4 h-4" /> {t.label}
                            {t.id === 'disputes' && disputes.filter(d => d.status === 'OPEN').length > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{disputes.filter(d => d.status === 'OPEN').length}</span>
                            )}
                            {t.id === 'withdrawals' && withdrawals.length > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{withdrawals.length}</span>
                            )}
                            {t.id === 'verifications' && verifications.length > 0 && (
                                <span className="bg-yellow-500 text-black text-xs rounded-full px-1.5 py-0.5 font-bold">{verifications.length}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>

                    {/* ── Stats ─────────────────────────────────── */}
                    {tab === 'stats' && stats && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: '👥', color: 'text-blue-400' },
                                    { label: 'Total Auctions', value: stats.totalAuctions.toLocaleString(), icon: '🔨', color: 'text-yellow-400' },
                                    { label: 'Live Now', value: stats.liveAuctions.toLocaleString(), icon: '🔴', color: 'text-red-400' },
                                    { label: 'Platform Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: 'text-green-400' },
                                    { label: 'Open Disputes', value: stats.openDisputes.toLocaleString(), icon: '⚠️', color: 'text-orange-400' },
                                    { label: 'Flagged Users', value: stats.flaggedUsers.toLocaleString(), icon: '🚩', color: 'text-red-400' }
                                ].map(card => (
                                    <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                        <p className="text-3xl mb-3">{card.icon}</p>
                                        <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                                        <p className="text-gray-400 text-sm mt-1">{card.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-yellow-400" /> Quick Actions</h3>
                                    <div className="space-y-2">
                                        <button onClick={() => setTab('disputes')} className="w-full text-left px-4 py-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/20 transition-colors text-sm font-semibold">
                                            🔔 Review {stats.openDisputes} open disputes
                                        </button>
                                        <button onClick={() => setTab('users')} className="w-full text-left px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-semibold">
                                            🚩 Review {stats.flaggedUsers} flagged users
                                        </button>
                                        <button onClick={() => setTab('withdrawals')} className="w-full text-left px-4 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors text-sm font-semibold">
                                            💸 Process {stats.pendingWithdrawals} pending payouts
                                        </button>
                                        <button onClick={() => setTab('verifications')} className="w-full text-left px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/20 transition-colors text-sm font-semibold">
                                            🏅 Review {verifications.length} seller verification requests
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <h3 className="font-bold mb-4">Platform Health</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Dispute Rate', value: stats.totalAuctions ? ((stats.openDisputes / stats.totalAuctions) * 100).toFixed(1) + '%' : '0%', good: true },
                                            { label: 'Live Auctions', value: stats.liveAuctions.toString(), good: stats.liveAuctions > 0 },
                                            { label: 'Flagged User Rate', value: stats.totalUsers ? ((stats.flaggedUsers / stats.totalUsers) * 100).toFixed(1) + '%' : '0%', good: stats.flaggedUsers < stats.totalUsers * 0.05 }
                                        ].map(m => (
                                            <div key={m.label} className="flex justify-between items-center">
                                                <span className="text-gray-400 text-sm">{m.label}</span>
                                                <span className={`font-bold text-sm ${m.good ? 'text-green-400' : 'text-red-400'}`}>{m.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Seller Verifications ──────────────────── */}
                    {tab === 'verifications' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <BadgeCheck className="w-5 h-5 text-yellow-400" /> Seller Verification Requests
                                    {verifications.length > 0 && <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-black">{verifications.length}</span>}
                                </h2>
                                <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                    {(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const).map(s => (
                                        <button key={s} onClick={async () => {
                                            setVerificationFilter(s);
                                            const res = await api.get(`/verification/admin/pending?status=${s}`);
                                            setVerifications(res.data.requests);
                                        }} className={`px-3 py-1.5 text-xs font-bold transition-colors ${verificationFilter === s ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:bg-white/5'}`}>{s.replace('_', ' ')}</button>
                                    ))}
                                </div>
                            </div>

                            {verifications.length === 0 && (
                                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                                    <BadgeCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500">No {verificationFilter.toLowerCase().replace('_', ' ')} verification requests.</p>
                                </div>
                            )}

                            {verifications.map(v => (
                                <div key={v.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                <span className="text-xs px-2 py-1 rounded-full font-bold border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">{v.status.replace('_', ' ')}</span>
                                                <span className="text-gray-500 text-xs">{new Date(v.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Applicant</p>
                                                    <p className="font-bold text-white">{v.user.fullName}</p>
                                                    <p className="text-gray-400 text-sm">{v.user.email}</p>
                                                    <p className="text-gray-500 text-xs mt-1">⭐ {Number(v.user.trustScore).toFixed(1)} · {v.user._count.bidsPlaced} bids · {v.user._count.auctionsAsSeller} listings</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Application Details</p>
                                                    <p className="text-white font-semibold">{v.fullLegalName}</p>
                                                    <p className="text-gray-400 text-sm capitalize">{v.businessType} seller</p>
                                                    {v.panNumber && <p className="text-gray-500 text-xs font-mono mt-1">PAN: {v.panNumber}</p>}
                                                    {v.aadhaarLast4 && <p className="text-gray-500 text-xs font-mono">Aadhaar: XXXX XXXX XXXX {v.aadhaarLast4}</p>}
                                                </div>
                                            </div>
                                            <div className="bg-black/20 rounded-xl p-3 border border-white/5 mb-4">
                                                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Plans to Sell</p>
                                                <p className="text-gray-300 text-sm leading-relaxed">{v.description}</p>
                                            </div>
                                            {(v.documentUrls.length > 0 || v.assetUrls.length > 0) && (
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    {v.documentUrls.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">ID Documents</p>
                                                            {v.documentUrls.map((url, i) => (
                                                                <a key={i} href={url} target="_blank" rel="noopener" className="block text-xs text-blue-400 hover:text-blue-300 underline truncate mb-1">📎 Document {i + 1}</a>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {v.assetUrls.length > 0 && (
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Asset Proof</p>
                                                            {v.assetUrls.map((url, i) => (
                                                                <a key={i} href={url} target="_blank" rel="noopener" className="block text-xs text-blue-400 hover:text-blue-300 underline truncate mb-1">🖼️ Asset {i + 1}</a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {(v.status === 'PENDING' || v.status === 'UNDER_REVIEW') ? (
                                            <div className="flex flex-col gap-2 flex-shrink-0 lg:w-48">
                                                <button disabled={resolving === v.id} onClick={() => handleVerificationReview(v.id, 'APPROVED')}
                                                    className="w-full px-4 py-3 bg-green-500 text-black font-black rounded-xl hover:bg-green-400 transition-all shadow-[0_0_15px_rgba(74,222,128,0.3)] disabled:opacity-50 flex items-center justify-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" /> Approve
                                                </button>
                                                <button disabled={resolving === v.id} onClick={() => {
                                                    const reason = prompt('Reason for rejection (shown to user):');
                                                    if (reason !== null) handleVerificationReview(v.id, 'REJECTED', reason);
                                                }}
                                                    className="w-full px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                                    <XCircle className="w-4 h-4" /> Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`px-4 py-2 rounded-full text-xs font-black border self-start ${v.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>{v.status}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Users ─────────────────────────────────── */}
                    {tab === 'users' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="Search users by name or email…" value={search} onChange={e => setSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50" />
                                </div>
                            </div>

                            {filteredUsers.map(u => (
                                <div key={u.id} className={`bg-white/5 border rounded-2xl p-5 ${u.isSuspended ? 'border-red-500/20' : u.suspiciousFlags >= 3 ? 'border-orange-500/20' : 'border-white/10'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-xl font-black text-yellow-400">
                                                {u.fullName?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{u.fullName || 'No name'}</p>
                                                <p className="text-gray-400 text-sm">{u.email}</p>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{u.role}</span>
                                                    <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">{u.verifiedStatus}</span>
                                                    {u.isSuspended && <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">🚫 Suspended</span>}
                                                    {u.suspiciousFlags >= 3 && <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">🚩 {u.suspiciousFlags} flags</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                                            <span className="text-sm text-gray-400">⭐ {Number(u.trustScore).toFixed(1)}</span>
                                            <span className="text-xs text-gray-500">{u._count.auctionsAsSeller} listings · {u._count.bidsPlaced} bids</span>

                                            <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => handleVerify(u.id, u.verifiedStatus === 'VERIFIED' ? 'BASIC' : 'VERIFIED')}
                                                    className={`px-3 py-1.5 text-xs font-bold transition-colors ${u.verifiedStatus === 'VERIFIED' ? 'bg-blue-500 text-white' : 'text-blue-400 hover:bg-blue-500/10'}`}>
                                                    {u.verifiedStatus === 'VERIFIED' ? 'Verified' : 'Verify'}
                                                </button>
                                                <button
                                                    onClick={() => handleVerify(u.id, u.verifiedStatus === 'PREMIUM' ? 'BASIC' : 'PREMIUM')}
                                                    className={`px-3 py-1.5 text-xs font-bold border-l border-white/10 transition-colors ${u.verifiedStatus === 'PREMIUM' ? 'bg-purple-500 text-white' : 'text-purple-400 hover:bg-purple-500/10'}`}>
                                                    {u.verifiedStatus === 'PREMIUM' ? 'Premium' : 'Go Premium'}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => handleSuspend(u.id, !u.isSuspended)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${u.isSuspended
                                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                                                    : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'}`}>
                                                {u.isSuspended ? 'Restore' : 'Suspend'}
                                            </button>
                                            <Link href={`/admin/users/${u.id}`} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Withdrawals ────────────────────────────── */}
                    {tab === 'withdrawals' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-blue-400" /> Pending Withdrawals
                                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{withdrawals.length}</span>
                            </h2>

                            {withdrawals.length === 0 && <p className="text-gray-500 text-center py-12">No manual withdrawals queued. Auto-approve is handling everything! 🤖🚀</p>}

                            {withdrawals.map(w => (
                                <div key={w.id} className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs px-2 py-1 rounded-full font-bold border bg-blue-500/10 text-blue-400 border-blue-500/30">PENDING_ADMIN</span>
                                                <span className="text-gray-500 text-xs">{new Date(w.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="font-bold text-white text-lg">{w.user.fullName}</p>
                                            <p className="text-gray-400 text-sm">{w.user.email}</p>

                                            <div className="flex items-center gap-2 mt-2 flex-wrap mb-4">
                                                <span className="text-sm bg-black/20 px-2 py-1 rounded-lg border border-white/5">⭐ {Number(w.user.trustScore).toFixed(1)}</span>
                                                <span className="text-sm bg-black/20 px-2 py-1 rounded-lg border border-white/5">{w.user.verifiedStatus}</span>
                                                {w.user.suspiciousFlags > 0 && <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded-lg">🚩 {w.user.suspiciousFlags} flags</span>}
                                            </div>

                                            <div className="bg-red-500/10 border border-red-500/20 flex items-start gap-2 p-3 rounded-xl max-w-lg">
                                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-red-400 text-sm leading-snug">
                                                    <span className="font-bold flex block mb-1">Auto-System Flag:</span>
                                                    {w.description.replace('Requires Review: ', '')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right flex-shrink-0 flex flex-col items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Amount</p>
                                                <p className="text-3xl font-black text-white">₹{Math.abs(Number(w.amount)).toLocaleString()}</p>
                                            </div>

                                            <div className="flex gap-2 w-full md:w-auto">
                                                <button onClick={() => handleWithdrawal(w.id, 'reject')} disabled={resolving === w.id}
                                                    className="flex-1 md:flex-none px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                                    Reject & Refund
                                                </button>
                                                <button onClick={() => handleWithdrawal(w.id, 'approve')} disabled={resolving === w.id}
                                                    className="flex-1 md:flex-none px-4 py-3 bg-green-500 border border-green-500 text-black shadow-[0_0_15px_rgba(74,222,128,0.3)] rounded-xl text-sm font-black hover:bg-green-400 transition-all disabled:opacity-50">
                                                    Approve Payout
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Disputes ──────────────────────────────── */}
                    {tab === 'disputes' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-400" /> Open Disputes
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{disputes.filter(d => d.status === 'OPEN').length}</span>
                            </h2>

                            {disputes.length === 0 && <p className="text-gray-500 text-center py-12">No disputes. Platform is healthy! ✅</p>}

                            {disputes.map(d => (
                                <div key={d.id} className={`border rounded-2xl p-6 ${d.status === 'OPEN' ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold border ${d.status === 'OPEN' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                                                    {d.status}
                                                </span>
                                                <span className="text-gray-500 text-xs">{new Date(d.createdAt).toLocaleString()}</span>
                                            </div>
                                            <Link href={`/auctions/${d.auctionId}`} className="font-bold text-white hover:text-yellow-400 transition-colors">
                                                {d.auction.title}
                                            </Link>
                                            <p className="text-gray-400 text-sm mt-1">Dispute by: <span className="text-white">{d.buyer.fullName}</span> ({d.buyer.email})</p>
                                            <p className="text-gray-400 text-sm mt-2 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{d.reason}</p>

                                            {/* Evidence Preview */}
                                            {d.evidenceUrls && d.evidenceUrls.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Evidence Photos</p>
                                                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                                                        {d.evidenceUrls.map((url, idx) => (
                                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                                className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 hover:border-yellow-400/50 transition-all flex-shrink-0 shadow-lg">
                                                                <Image src={url} alt={`Evidence ${idx + 1}`} fill className="object-cover" sizes="96px" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-gray-400 text-xs">Auction Value</p>
                                            <p className="text-xl font-black text-white">₹{Number(d.auction.currentHighestBid).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {d.status !== 'OPEN' && (
                                        <div className="mt-4 p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-green-400">Resolution Log</p>
                                            <p className="text-sm text-gray-300 italic">"{d.adminNotes || 'No notes provided.'}"</p>
                                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider pt-2 border-t border-white/5">
                                                <span>Resolved By Admin</span>
                                                <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {d.status === 'OPEN' && (
                                        <div className="space-y-3">
                                            <input type="text" value={adminNote} onChange={e => setAdminNote(e.target.value)}
                                                placeholder="Admin note (visible to both parties)…"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50" />
                                            <div className="flex gap-2 flex-wrap">
                                                <button onClick={() => resolveDispute(d.id, 'REFUND_BUYER')} disabled={resolving === d.id}
                                                    className="flex-1 px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                                    Refund Buyer
                                                </button>
                                                <button onClick={() => resolveDispute(d.id, 'RELEASE_SELLER')} disabled={resolving === d.id}
                                                    className="flex-1 px-4 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-bold hover:bg-green-500/20 transition-colors disabled:opacity-50">
                                                    Release to Seller
                                                </button>
                                                <button onClick={() => resolveDispute(d.id, 'PARTIAL_REFUND')} disabled={resolving === d.id}
                                                    className="px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-colors disabled:opacity-50">
                                                    Split
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Auctions ──────────────────────────────── */}
                    {tab === 'auctions' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="Search auctions by title or seller email…" value={search} onChange={e => setSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50" />
                                </div>
                            </div>

                            {filteredAuctions.map(a => (
                                <div key={a.id} className={`bg-white/5 border rounded-2xl p-5 ${a.status === 'CANCELLED' ? 'border-red-500/20 opacity-70' : 'border-white/10'}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-xl font-black text-yellow-400">
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <Link href={`/auctions/${a.id}`} className="font-bold text-white hover:text-yellow-400 transition-colors line-clamp-1">
                                                    {a.title}
                                                </Link>
                                                <p className="text-gray-400 text-sm">Seller: {a.seller.fullName} ({a.seller.email})</p>
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${['LIVE', 'SHIPPED', 'PAID', 'DELIVERED'].includes(a.status) ? 'bg-green-500/10 text-green-400 border-green-500/30' : a.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                        {a.status}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{a.category.name}</span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.endTime).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Highest Bid</p>
                                                <p className="text-lg font-black text-white px-2">₹{Number(a.currentHighestBid || a.startingPrice).toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-400 text-center">{a._count.bids} bids</p>
                                            </div>

                                            {a.status !== 'CANCELLED' && (
                                                <button
                                                    disabled={resolving === a.id}
                                                    onClick={() => handleRemoveAuction(a.id)}
                                                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50">
                                                    Take Down
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
