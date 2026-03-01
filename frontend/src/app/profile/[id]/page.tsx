'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowLeft, CheckCircle2, Package, Activity, MessageSquare, Shield } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/store/AuthContext';

interface SellerProfile {
    id: string; fullName: string; avatarUrl: string | null;
    verifiedStatus: string; trustScore: number; createdAt: string;
    _count: { auctionsAsSeller: number; ratingsReceived: number };
}
interface Rating {
    id: string; score: number; comment: string | null; createdAt: string;
    fromUser: { id: string; fullName: string };
    auction: { id: string; title: string };
}
interface Auction {
    id: string; title: string; currentHighestBid: number; status: string; endTime: string; imageUrls: string[];
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                    onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}
                    className="transition-transform hover:scale-110">
                    <Star className={`w-8 h-8 transition-colors ${n <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                </button>
            ))}
        </div>
    );
}

export default function ProfilePage() {
    const { id } = useParams() as { id: string };
    const { user } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<SellerProfile | null>(null);
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [myAuctions, setMyAuctions] = useState<Auction[]>([]);
    const [scoresDist, setScoresDist] = useState<Record<number, number>>({});
    const [tab, setTab] = useState<'reviews' | 'listings'>('reviews');
    const [rateScore, setRateScore] = useState(0);
    const [rateComment, setRateComment] = useState('');
    const [rateAuction, setRateAuction] = useState('');
    const [rateMsg, setRateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [rating, setRating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get(`/ratings/user/${id}`),
        ]).then(([ratingsRes]) => {
            setProfile(ratingsRes.data.user);
            setRatings(ratingsRes.data.ratings);
            setScoresDist(ratingsRes.data.stats.distribution || {});
        }).catch(() => { }).finally(() => setLoading(false));
    }, [id]);

    // Load user's COMPLETED auctions where they won from this seller (for rating eligibility)
    useEffect(() => {
        if (!user) return;
        api.get('/auctions/my/bids').then(r => {
            const eligible = r.data.bids
                .filter((b: any) => b.auction.status === 'COMPLETED' && b.auction.seller.id === id && b.isWinning)
                .map((b: any) => b.auction);
            setMyAuctions(eligible);
        }).catch(() => { });
    }, [user]);

    const submitRating = async () => {
        if (!rateScore) return setRateMsg({ type: 'error', text: 'Please select a star rating.' });
        if (!rateAuction) return setRateMsg({ type: 'error', text: 'Please select which auction you are rating for.' });
        setRating(true);
        try {
            await api.post('/ratings', {
                toUserId: id,
                auctionId: rateAuction,
                score: rateScore,
                comment: rateComment || undefined
            });
            setRateMsg({ type: 'success', text: 'Your rating has been submitted! Thank you.' });
            setRateScore(0); setRateComment(''); setRateAuction('');
            // Refresh ratings
            const r = await api.get(`/ratings/user/${id}`);
            setRatings(r.data.ratings);
            setScoresDist(r.data.stats.distribution || {});
        } catch (e: any) {
            setRateMsg({ type: 'error', text: e.response?.data?.error || 'Failed to submit rating.' });
        } finally { setRating(false); }
    };

    const labels = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center"><p className="text-4xl mb-4">👤</p><p className="text-gray-400">User not found.</p></div>
        </div>
    );

    const avgScore = Number(profile.trustScore) || 0;

    return (
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
            <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
            </Link>

            <div className="grid md:grid-cols-3 gap-8">

                {/* ── Left: Profile Card ─────────────────────── */}
                <div className="space-y-5">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-4xl font-black text-black mx-auto mb-4 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                            {profile.fullName?.charAt(0) || '?'}
                        </div>
                        <h1 className="text-2xl font-black text-white mb-1">{profile.fullName || 'Anonymous'}</h1>
                        {profile.verifiedStatus !== 'BASIC' && (
                            <div className="inline-flex items-center gap-1.5 text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1.5 rounded-full text-xs font-bold mb-3">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Seller
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-1 mt-2 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-5 h-5 ${i < Math.round(avgScore) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                            ))}
                        </div>
                        <p className="text-4xl font-black text-yellow-400 mb-1">{avgScore.toFixed(1)}</p>
                        <p className="text-gray-500 text-sm">{ratings.length} reviews</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                        {[
                            { icon: Activity, label: 'Auctions Listed', value: profile._count.auctionsAsSeller },
                            { icon: Star, label: 'Total Reviews', value: profile._count.ratingsReceived },
                            { icon: Shield, label: 'Trust Score', value: Number(profile.trustScore).toFixed(1) + ' / 5' },
                            { icon: Package, label: 'Member Since', value: new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) }
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 flex items-center gap-2"><Icon className="w-4 h-4 text-yellow-400" /> {item.label}</span>
                                    <span className="text-white font-bold">{item.value}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Score Distribution */}
                    {ratings.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <p className="text-sm font-semibold text-gray-400 mb-4">Rating Breakdown</p>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map(n => {
                                    const count = scoresDist[n] || 0;
                                    const pct = ratings.length ? (count / ratings.length) * 100 : 0;
                                    return (
                                        <div key={n} className="flex items-center gap-3">
                                            <span className="text-yellow-400 text-xs font-bold w-4">{n}★</span>
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div className="h-full bg-yellow-400 rounded-full"
                                                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 }} />
                                            </div>
                                            <span className="text-gray-500 text-xs w-6 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right: Reviews + Rate Form ─────────────── */}
                <div className="md:col-span-2 space-y-6">

                    {/* Tab Bar */}
                    <div className="flex gap-2 bg-white/5 border border-white/10 p-1.5 rounded-xl">
                        {(['reviews', 'listings'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg capitalize transition-all ${tab === t ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'}`}>
                                {t === 'reviews' ? `Reviews (${ratings.length})` : 'Leave a Review'}
                            </button>
                        ))}
                    </div>

                    {/* Reviews Tab */}
                    {tab === 'reviews' && (
                        <div className="space-y-4">
                            {ratings.length === 0 ? (
                                <div className="text-center py-16 text-gray-500">
                                    <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>No reviews yet for this seller.</p>
                                </div>
                            ) : ratings.map(r => (
                                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center font-bold text-yellow-400">
                                                {r.fromUser.fullName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm">{r.fromUser.fullName || 'Anonymous'}</p>
                                                <p className="text-gray-500 text-xs">for: {r.auction.title}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < r.score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                                                ))}
                                            </div>
                                            <span className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    {r.comment && <p className="text-gray-300 text-sm leading-relaxed">{r.comment}</p>}
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Leave Review Tab */}
                    {tab === 'listings' && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-yellow-400" /> Leave a Review
                            </h3>

                            {!user ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-400 mb-4">You need to be logged in to leave a review.</p>
                                    <Link href="/auth" className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors">
                                        Sign In
                                    </Link>
                                </div>
                            ) : user.id === id ? (
                                <p className="text-gray-400 text-sm text-center py-6">You cannot rate yourself.</p>
                            ) : (
                                <>
                                    <AnimatePresence>
                                        {rateMsg && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className={`px-4 py-3 rounded-xl text-sm font-semibold ${rateMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                                                {rateMsg.text}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div>
                                        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Your Rating</label>
                                        <StarPicker value={rateScore} onChange={setRateScore} />
                                        {rateScore > 0 && <p className="text-yellow-400 text-xs mt-1.5 font-medium">{labels[rateScore - 1]}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Which Auction?</label>
                                        {myAuctions.length === 0 ? (
                                            <p className="text-gray-500 text-sm bg-white/5 border border-white/10 rounded-xl p-4">
                                                You can only rate a seller after winning one of their completed auctions.
                                            </p>
                                        ) : (
                                            <select value={rateAuction} onChange={e => setRateAuction(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-yellow-400/50">
                                                <option value="">Select auction…</option>
                                                {myAuctions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                            </select>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Comment <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                                        <textarea value={rateComment} onChange={e => setRateComment(e.target.value)}
                                            placeholder="Share your experience with this seller…"
                                            rows={4} maxLength={500}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 outline-none focus:border-yellow-400/50 resize-none transition-all" />
                                        <p className="text-gray-600 text-xs mt-1 text-right">{rateComment.length}/500</p>
                                    </div>

                                    <button onClick={submitRating} disabled={rating || myAuctions.length === 0}
                                        className="w-full py-3.5 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {rating ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Star className="w-5 h-5" />}
                                        Submit Review
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
