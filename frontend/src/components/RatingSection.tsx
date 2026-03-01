'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, MessageSquare, CheckCircle2, Loader2, Award } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/axios';
import { useAuth } from '@/store/AuthContext';

// ── Types ──────────────────────────────────────────────────────────
interface Rating {
    id: string;
    score: number;
    comment: string | null;
    createdAt: string;
    fromUser: { id: string; fullName: string | null; avatarUrl: string | null };
    auction: { id: string; title: string };
}

interface RatingStats {
    total: number;
    trustScore: number;
    distribution: Record<number, number>;
}

// ── Star Renderer ──────────────────────────────────────────────────
function Stars({ score, size = 'sm', interactive = false, onChange }: {
    score: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onChange?: (s: number) => void;
}) {
    const [hovered, setHovered] = useState(0);
    const sizeMap = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };
    const display = interactive ? (hovered || score) : score;

    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <button
                    key={i}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onChange?.(i)}
                    onMouseEnter={() => interactive && setHovered(i)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
                >
                    <Star
                        className={`${sizeMap[size]} transition-colors ${i <= display
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-600'
                            }`}
                    />
                </button>
            ))}
        </div>
    );
}

// ── Rating Bar ─────────────────────────────────────────────────────
function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 w-6 text-right">{label}</span>
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                />
            </div>
            <span className="text-gray-500 text-xs w-6">{count}</span>
        </div>
    );
}

// ── Submit Form ────────────────────────────────────────────────────
function RatingSubmitForm({ auctionId, toUserId, toUserName, onSuccess }: {
    auctionId: string;
    toUserId: string;
    toUserName: string;
    onSuccess: () => void;
}) {
    const [score, setScore] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent!'];

    const submit = async () => {
        if (score < 1) return setError('Please select a star rating.');
        setSubmitting(true);
        setError('');
        try {
            await api.post('/ratings', { auctionId, toUserId, score, comment: comment.trim() || undefined });
            setDone(true);
            setTimeout(onSuccess, 1500);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to submit rating.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done) return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-3 py-8 text-center"
        >
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-white font-bold text-lg">Rating Submitted!</p>
            <p className="text-gray-400 text-sm">{toUserName}'s trust score has been updated.</p>
        </motion.div>
    );

    return (
        <div className="space-y-5">
            {/* Stars */}
            <div className="flex flex-col items-center gap-2 py-4">
                <Stars score={score} size="lg" interactive onChange={setScore} />
                <AnimatePresence mode="wait">
                    {score > 0 && (
                        <motion.p
                            key={score}
                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`text-sm font-bold ${score >= 4 ? 'text-green-400' : score >= 3 ? 'text-yellow-400' : 'text-red-400'}`}
                        >
                            {LABELS[score]}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Comment */}
            <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Review (optional)
                </label>
                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={`Describe your experience with ${toUserName}…`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 resize-none focus:outline-none focus:border-yellow-400/50 transition-colors"
                />
                <p className="text-gray-600 text-xs mt-1 text-right">{comment.length}/500</p>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">{error}</p>}

            <button
                onClick={submit}
                disabled={submitting || score < 1}
                className="w-full bg-yellow-400 text-black font-black py-3.5 rounded-xl hover:bg-yellow-300 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
            >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ThumbsUp className="w-5 h-5" /> Submit Rating</>}
            </button>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────
interface RatingSectionProps {
    sellerId: string; // The user whose profile these ratings belong to
    sellerName: string;
    auctionId: string;
    /** Pass the winning buyer ID if current user is a seller, or seller ID if current user is buyer */
    canRateUserId?: string;
    canRateUserName?: string;
    showForm?: boolean;
    targetType?: 'SELLER' | 'BUYER';
}

export default function RatingSection({
    sellerId, sellerName, auctionId, canRateUserId, canRateUserName, showForm = false, targetType = 'SELLER'
}: RatingSectionProps) {
    const { user } = useAuth();
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [stats, setStats] = useState<RatingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasRated, setHasRated] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const load = useCallback(async () => {
        try {
            const r = await api.get(`/ratings/user/${sellerId}`);
            setRatings(r.data.ratings);
            setStats(r.data.stats);

            // Check if current user already submitted a rating for this auction
            if (user) {
                const alreadyRated = r.data.ratings.some(
                    (rt: Rating) => rt.fromUser.id === user.id && rt.auction?.id === auctionId
                );
                setHasRated(alreadyRated);
            }
        } catch { } finally {
            setLoading(false);
        }
    }, [sellerId, user?.id, auctionId]);

    useEffect(() => { load(); }, [load]);

    const displayed = showAll ? ratings : ratings.slice(0, 3);

    if (loading) return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
    );

    return (
        <div className="space-y-8">

            {/* ── Summary Header ──────────────────────────── */}
            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">

                        {/* Score Block */}
                        <div className="flex-shrink-0 text-center">
                            <p className="text-6xl font-black text-white leading-none">
                                {stats.trustScore.toFixed(1)}
                            </p>
                            <Stars score={stats.trustScore} size="md" />
                            <p className="text-gray-500 text-xs mt-1.5">{stats.total} review{stats.total !== 1 ? 's' : ''}</p>
                        </div>

                        <div className="hidden sm:block w-px h-16 bg-white/10 flex-shrink-0" />

                        {/* Distribution Bars */}
                        <div className="flex-1 space-y-1.5 w-full">
                            {[5, 4, 3, 2, 1].map(n => (
                                <RatingBar
                                    key={n}
                                    label={String(n)}
                                    count={stats.distribution[n] || 0}
                                    total={stats.total}
                                />
                            ))}
                        </div>

                        {/* Seller Badge */}
                        {stats.trustScore >= 4.5 && (
                            <div className="hidden lg:flex flex-col items-center gap-1.5 text-center flex-shrink-0">
                                <div className="w-12 h-12 bg-yellow-400/10 rounded-full flex items-center justify-center border border-yellow-400/30">
                                    <Award className="w-6 h-6 text-yellow-400" />
                                </div>
                                <p className="text-yellow-400 text-xs font-bold">Top Seller</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── Rating Form ─────────────────────────────── */}
            {showForm && canRateUserId && user && !hasRated && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-yellow-400/5 to-transparent border border-yellow-400/20 rounded-2xl p-6"
                >
                    <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        Rate Your Experience with {canRateUserName || sellerName}
                    </h3>
                    <p className="text-gray-500 text-sm mb-5">Your honest review helps build marketplace trust.</p>
                    <RatingSubmitForm
                        auctionId={auctionId}
                        toUserId={canRateUserId}
                        toUserName={canRateUserName || sellerName}
                        onSuccess={() => { setHasRated(true); load(); }}
                    />
                </motion.div>
            )}

            {hasRated && showForm && (
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-5 py-4 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-400 font-semibold text-sm">You've already submitted a rating for this transaction.</p>
                </div>
            )}

            {/* ── Reviews List ───────────────────────────── */}
            {ratings.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                        Reviews from {targetType === 'SELLER' ? 'Buyers' : 'Sellers'}
                    </h3>

                    <AnimatePresence>
                        {displayed.map((rating, i) => (
                            <motion.div
                                key={rating.id}
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="bg-white/5 border border-white/8 rounded-2xl p-5 space-y-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400/30 to-orange-500/30 border border-white/10 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                                            {rating.fromUser.avatarUrl ? (
                                                <Image src={rating.fromUser.avatarUrl} alt="" fill className="object-cover" />
                                            ) : (
                                                (rating.fromUser.fullName || 'A').charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold text-sm">
                                                {rating.fromUser.fullName || 'Anonymous Buyer'}
                                            </p>
                                            <p className="text-gray-600 text-xs">
                                                {new Date(rating.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                            </p>
                                        </div>
                                    </div>
                                    <Stars score={rating.score} size="sm" />
                                </div>

                                {/* Auction tag */}
                                <p className="text-gray-600 text-xs bg-white/5 px-3 py-1.5 rounded-lg inline-block">
                                    Re: {rating.auction?.title}
                                </p>

                                {/* Comment */}
                                {rating.comment && (
                                    <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-white/10 pl-3">
                                        "{rating.comment}"
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {ratings.length > 3 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="w-full py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all text-sm font-semibold"
                        >
                            {showAll ? 'Show Less' : `See All ${ratings.length} Reviews`}
                        </button>
                    )}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-600">
                    <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No reviews yet</p>
                    <p className="text-sm mt-1">Be the first to rate this {targetType.toLowerCase()}.</p>
                </div>
            )}
        </div>
    );
}
