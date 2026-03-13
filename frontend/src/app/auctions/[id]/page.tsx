'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Share2, Heart, ShieldCheck as Shield, Clock as Timer, TrendingUp,
    CheckCircle2, AlertTriangle, Package, Zap, Activity, Loader2, MessageSquare, Star, Flame, ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/axios';
import { useAuth } from '@/store/AuthContext';
import SwipeToBid from '@/components/SwipeToBid';
import RatingSection from '@/components/RatingSection';
import AuthenticityBadge from '@/components/AuthenticityBadge';
import LivePulseFeed from '@/components/LivePulseFeed';
import Confetti from '@/components/Confetti';
import { Skeleton } from '@/components/ui/Skeleton';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import Schema from '@/components/seo/Schema';


// ── Helpers ────────────────────────────────────────────────────────
function getMinIncrement(currentBid: number): number {
    const bid = Number(currentBid);
    if (bid <= 1000) return Math.ceil((bid * 0.05) / 10) * 10 || 50;
    if (bid <= 5000) return Math.ceil((bid * 0.03) / 10) * 10;
    if (bid <= 20000) return Math.ceil((bid * 0.02) / 50) * 50;
    if (bid <= 50000) return Math.ceil((bid * 0.015) / 100) * 100;
    return Math.ceil((bid * 0.01) / 100) * 100;
}

function useCountdown(endTime: string | null) {
    const [time, setTime] = useState('');
    const [urgent, setUrgent] = useState(false);

    useEffect(() => {
        if (!endTime) return;
        const tick = () => {
            const diff = new Date(endTime).getTime() - Date.now();
            if (diff <= 0) { setTime('ENDED'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setUrgent(diff < 60000);
            setTime(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endTime]);

    return { time, urgent };
}


// ── Types ──────────────────────────────────────────────────────────
interface Bid { bidderId: string; amount: number; time?: string; user?: string; isAutoBid?: boolean }
interface Auction {
    id: string; title: string; description: string; imageUrls: string[];
    currentHighestBid: number; endTime: string; status: string;
    startingPrice: number; reservePrice: number | null; shippingCost: number;
    buyItNowPrice: number | null; bidIncrement: number; viewCount: number;
    seller: { id: string; fullName: string; trustScore: number; verifiedStatus: string };
    category: { name: string };
    bids: Array<{ id: string; amount: number; bidderId: string; isWinning: boolean; createdAt: string; bidder: { fullName: string } }>;
    _count: { bids: number };
    uniqueBiddersCount?: number;
}

// ── Skeleton Loader ───────────────────────────────────────────────
function LiveAuctionSkeleton() {
    return (
        <div className="container mx-auto px-4 md:px-8 py-20 max-w-7xl relative min-h-screen">
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-3/5 space-y-6">
                    <Skeleton className="aspect-video w-full rounded-[2rem]" />
                    <div className="flex gap-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-24 h-24 rounded-2xl" />)}
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-24 rounded-full" />
                        <Skeleton className="h-12 w-3/4" />
                        <div className="flex gap-3">
                            <Skeleton className="h-8 w-32 rounded-full" />
                            <Skeleton className="h-8 w-40 rounded-full" />
                        </div>
                    </div>
                    <Skeleton className="h-48 w-full rounded-[2rem]" />
                </div>
                <div className="w-full lg:w-2/5 space-y-6">
                    <div className="bg-zinc-950/80 border border-white/10 p-10 rounded-[2.5rem] space-y-8">
                        <div className="flex justify-between">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-16 w-48" />
                            </div>
                            <Skeleton className="h-20 w-32 rounded-2xl" />
                        </div>
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-20 w-full rounded-3xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
export default function LiveAuctionPage() {
    const { id } = useParams() as { id: string };
    const { user, refreshUser } = useAuth();
    const router = useRouter();

    const [auction, setAuction] = useState<Auction | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [bidAmount, setBidAmount] = useState(0);
    const [maxBid, setMaxBid] = useState('');
    const [bidding, setBidding] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [outbid, setOutbid] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [wsConnected, setWsConnected] = useState(false);
    const [userTotalBids, setUserTotalBids] = useState(0);
    const [isConnecting, setIsConnecting] = useState(false);
    const [uniqueBidders, setUniqueBidders] = useState(0);
    const [isWatched, setIsWatched] = useState(false);
    const [isWatchingLoading, setIsWatchingLoading] = useState(false);
    const [viewers, setViewers] = useState(0);
    const [activeReactions, setActiveReactions] = useState<Array<{ id: number; symbol: string; x: number }>>([]);
    const [lastBidderId, setLastBidderId] = useState<string | null>(null);
    const [streakCount, setStreakCount] = useState(0);
    const [pulseEffect, setPulseEffect] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const currentBidAmt = Number(auction?.currentHighestBid || 0);
    const increment = Math.max(getMinIncrement(currentBidAmt), Number(auction?.bidIncrement || 0));
    const minNext = currentBidAmt > 0
        ? Math.ceil(currentBidAmt + increment)
        : Number(auction?.startingPrice || 0);
    const isSeller = user && auction && user.id === auction.seller.id;
    const topBidder = bids[0]?.bidderId;

    const socketRef = useRef<Socket | null>(null);
    const { time, urgent } = useCountdown(auction?.endTime ?? null);

    // ── Load Auction ─────────────────────────────────────────
    useEffect(() => {
        api.get(`/auctions/${id}`).then(res => {
            const a = res.data.auction;
            setAuction(a);
            setUserTotalBids(res.data.userTotalBids || 0);
            setIsWatched(res.data.isWatched || false);
            setUniqueBidders(res.data.uniqueBiddersCount || 0);
            const current = Number(a.currentHighestBid);
            const inc = Math.max(getMinIncrement(current), Number(a.bidIncrement || 0));
            setBidAmount(current > 0 ? Math.ceil(current + inc) : Number(a.startingPrice));
            setBids(a.bids.slice(0, 10).map((b: any) => ({
                bidderId: b.bidderId,
                amount: Number(b.amount),
                time: new Date(b.createdAt).toLocaleTimeString(),
                user: b.bidder?.fullName ? `${b.bidder.fullName.charAt(0)}***` : 'Anon'
            })));
            if (user && a.seller?.id) {
                api.get(`/social/status/${a.seller.id}`).then(r => setIsFollowing(r.data.isFollowing)).catch(() => { });
            }
        }).catch(() => setMessage({ type: 'error', text: 'Failed to load auction.' }));
    }, [id, user]);

    // ── WebSocket ─────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const initSocket = () => {
            if (socketRef.current) return;

            const token = localStorage.getItem('token');

            const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'https://bidora-api-production.up.railway.app';
            console.log('[WS] Initializing connection to:', WS_URL);
            setIsConnecting(true);

            const socket = io(WS_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000
            });

            socketRef.current = socket;

            socket.on('connect', () => {
                console.log('[WS] Connected successfully');
                setWsConnected(true);
                setIsConnecting(false);
                socket.emit('join_auction', id);
            });

            socket.on('connect_error', (err) => {
                console.error('[WS] Connection error:', err);
                setWsConnected(false);
                setIsConnecting(false);
            });

            socket.on('disconnect', (reason) => {
                console.warn('[WS] Disconnected:', reason);
                setWsConnected(false);
            });

            socket.on('new_bid', (data: any) => {
                try {
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.volume = 0.2;
                    audio.play().catch(() => { });
                } catch (e) { }

                setAuction(prev => prev ? { ...prev, currentHighestBid: data.highestBid } : prev);

                setLastBidderId(prev => {
                    if (prev === data.bidderId) {
                        setStreakCount(s => s + 1);
                    } else {
                        setStreakCount(1);
                    }
                    return data.bidderId;
                });

                setPulseEffect(true);
                if (data.bidderId !== user?.id) {
                    setOutbid(true);
                    if (typeof window !== 'undefined' && window.navigator.vibrate) {
                        window.navigator.vibrate([100, 50, 100]); // Competitive double-buzz
                    }
                }
                setTimeout(() => setPulseEffect(false), 800);

                setBids(prev => [{
                    bidderId: data.bidderId,
                    amount: data.highestBid,
                    time: new Date().toLocaleTimeString(),
                    user: data.bidderId === user?.id ? 'You' : 'Bidder',
                    isAutoBid: data.isAutoBid
                }, ...prev].slice(0, 15));

                setBidAmount(prev => {
                    if (prev <= data.highestBid) {
                        const nextInc = getMinIncrement(data.highestBid);
                        return Math.ceil(data.highestBid + nextInc);
                    }
                    return prev;
                });
            });

            socket.on('new_reaction', (data: { reaction: string }) => {
                const id = Date.now() + Math.random();
                const x = 20 + Math.random() * 60;
                setActiveReactions(prev => [...prev.slice(-10), { id, symbol: data.reaction, x }]);
                setTimeout(() => {
                    setActiveReactions(prev => prev.filter(r => r.id !== id));
                }, 3000);
            });

            socket.on('time_extended', (data: any) => {
                setAuction(prev => prev ? { ...prev, endTime: data.newEndTime } : prev);
                setMessage({ type: 'info', text: '⏱ Auction extended 10 seconds!' });
            });

            socket.on('outbid', () => {
                setOutbid(true);
                setTimeout(() => setOutbid(false), 5000);
            });

            socket.on('bid_confirmed', (data: any) => {
                setBidding(false);
                setUserTotalBids(prev => prev + Number(data.yourBid));
                setMessage({ type: 'success', text: '✅ Bid confirmed!' });
                refreshUser();

                if (typeof window !== 'undefined' && window.navigator.vibrate) {
                    window.navigator.vibrate([50, 30, 50]);
                }
            });

            socket.on('room_stats', (data: { viewers: number }) => {
                setViewers(data.viewers);
            });

            socket.on('bid_error', (data: any) => {
                setBidding(false);
                setMessage({ type: 'error', text: data.message });
            });
        };

        initSocket();

        return () => {
            if (socketRef.current) {
                console.log('[WS] Cleaning up socket');
                socketRef.current.emit('leave_auction', id);
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [id, user?.id]);

    const availableBalance = user ? (Number(user.walletBalance) - Number(user.pendingFunds)) : 0;

    const placeBid = useCallback(() => {
        if (!user) return router.push('/auth');

        if (!socketRef.current || !wsConnected) {
            return setMessage({ type: 'error', text: 'Live feed is connecting... please wait a few seconds and try again.' });
        }

        if (user.id === auction?.seller.id) {
            return setMessage({ type: 'info', text: 'Sellers cannot bid on their own auctions!' });
        }

        if (user.id === topBidder) {
            return setMessage({ type: 'info', text: 'You are already the leading bidder!' });
        }

        if (Number(user.trustScore || 5) < 2.0) {
            return setMessage({ type: 'error', text: 'Your trust score is too low (below 2.0) to place bids.' });
        }

        if (availableBalance < bidAmount) {
            return setMessage({ type: 'error', text: `Insufficient balance! You need ₹${bidAmount.toLocaleString()}, but you have ₹${availableBalance.toLocaleString()} available.` });
        }

        if (bidAmount < minNext) {
            return setMessage({ type: 'error', text: `Someone just bid higher! Please bid at least ₹${Math.round(minNext).toLocaleString()}` });
        }

        // Exact multiple rule
        if (currentBidAmt > 0) {
            const diff = bidAmount - currentBidAmt;
            if (Math.round(diff) % Math.round(increment) !== 0) {
                return setMessage({ type: 'error', text: `Bids must be in exact multiples of ₹${increment} above the current price.` });
            }
        }

        setBidding(true);
        setMessage(null);
        socketRef.current.emit('place_bid', { auctionId: id, amount: bidAmount });

        setTimeout(() => {
            setBidding(prev => {
                if (prev) {
                    setMessage({ type: 'info', text: 'Bidding is taking longer than usual... please refresh.' });
                    return false;
                }
                return false;
            });
        }, 10000);
    }, [bidAmount, auction, user, id, router, availableBalance, wsConnected]);

    const purchaseNow = useCallback(() => {
        if (!user) return router.push('/auth');
        if (!auction?.buyItNowPrice) return;

        const price = Number(auction.buyItNowPrice);
        if (availableBalance < price) {
            return setMessage({ type: 'error', text: `Insufficient balance for Buy It Now (₹${price.toLocaleString()})` });
        }

        if (confirm(`Confirm instant purchase for ₹${price.toLocaleString()}?`)) {
            setBidding(true);
            socketRef.current?.emit('place_bid', { auctionId: id, amount: price });
        }
    }, [auction, user, id, router, availableBalance]);

    const setAutoBid = useCallback(async () => {
        if (!user) return router.push('/auth');

        const currentAmt = Number(auction?.currentHighestBid || 0);
        const minAllowed = currentAmt > 0 ? currentAmt : Number(auction?.startingPrice || 0);

        if (!maxBid || Number(maxBid) <= minAllowed) {
            return setMessage({ type: 'error', text: `Max bid must exceed the minimum required (₹${minAllowed.toLocaleString()})` });
        }
        try {
            await api.post(`/auctions/${id}/auto-bid`, { maxAmount: Number(maxBid) });
            setMessage({ type: 'success', text: `✅ Auto-bid activated up to ₹${Number(maxBid).toLocaleString()}` });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to set auto-bid' });
        }
    }, [maxBid, auction, id, user, router]);

    const toggleWatch = async () => {
        if (!user) return router.push('/auth');
        setIsWatchingLoading(true);
        try {
            const res = await api.post('/watchlist/toggle', { auctionId: id });
            setIsWatched(res.data.isWatched);
            setMessage({ type: 'success', text: res.data.message });
        } catch (e) {
            console.error('Watchlist toggle failed', e);
            setMessage({ type: 'error', text: 'Failed to update watchlist.' });
        } finally {
            setIsWatchingLoading(false);
        }
    };

    const toggleFollow = async () => {
        if (!user) return router.push('/auth');
        if (!auction) return;
        setIsFollowLoading(true);
        try {
            if (isFollowing) {
                await api.delete(`/social/unfollow/${auction.seller.id}`);
                setIsFollowing(false);
                setMessage({ type: 'success', text: 'Unfollowed seller' });
            } else {
                await api.post(`/social/follow/${auction.seller.id}`);
                setIsFollowing(true);
                setMessage({ type: 'success', text: 'Now following seller!' });
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Action failed' });
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Bidora: ${auction?.title}`,
            text: `Check out this auction on Bidora: ${auction?.title}`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setMessage({ type: 'success', text: 'Link copied to clipboard!' });
            }
        } catch (err) {
            console.error('Share failed', err);
        }
    };

    const sendReaction = (reaction: string) => {
        if (!socketRef.current || !wsConnected) return;
        socketRef.current.emit('send_reaction', { auctionId: id, reaction });

        const rid = Date.now() + Math.random();
        const rx = 20 + Math.random() * 60;
        setActiveReactions(prev => [...prev.slice(-10), { id: rid, symbol: reaction, x: rx }]);
        setTimeout(() => {
            setActiveReactions(prev => prev.filter(r => r.id !== rid));
        }, 3000);

        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
    };

    if (!auction) return <LiveAuctionSkeleton />;

    const isLive = auction.status === 'LIVE' && time !== 'ENDED';
    const displayStatus = (auction.status === 'LIVE' && time === 'ENDED') ? 'FINALIZING...' : auction.status;
    const isWinner = !isLive && user?.id === topBidder && ['PAYMENT_PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(auction.status);
    const needsPayment = isWinner && auction.status === 'PAYMENT_PENDING';
    const orderActive = isWinner && ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(auction.status);

    return (
        <div className="container mx-auto px-4 md:px-8 py-20 max-w-7xl relative min-h-screen">
            {(needsPayment || orderActive) && <Confetti />}

            <div className="fixed inset-0 pointer-events-none z-[100] preserve-3d">
                <AnimatePresence>
                    {activeReactions.map(r => (
                        <motion.div
                            key={r.id}
                            initial={{ y: '100vh', opacity: 0, scale: 0.5, rotate: -20 }}
                            animate={{ y: '-10vh', opacity: [0, 1, 1, 0], scale: [1, 1.5, 1.2, 1], rotate: [0, 20, -20, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 3, ease: 'easeOut' }}
                            style={{ position: 'absolute', left: `${r.x}%`, fontSize: '3rem' }}
                        >
                            {r.symbol}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="absolute top-40 left-10 w-[40vw] h-[40vw] bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-40 right-10 w-[30vw] h-[30vw] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />

            <Breadcrumbs
                items={[
                    { label: 'Live Auctions', href: '/search' },
                    { label: auction.category.name, href: `/search?category=${auction.category.name}` },
                    { label: auction.title, href: `/auctions/${id}` }
                ]}
            />

            <Schema
                data={{
                    '@context': 'https://schema.org/',
                    '@type': 'Product',
                    'name': auction.title,
                    'image': auction.imageUrls,
                    'description': auction.description,
                    'brand': {
                        '@type': 'Brand',
                        'name': auction.category.name.split(' ')[0] || 'Sneakers'
                    },
                    'offers': {
                        '@type': 'Offer',
                        'url': `https://bidora.me/auctions/${id}`,
                        'price': auction.currentHighestBid || auction.startingPrice,
                        'priceCurrency': 'INR',
                        'availability': auction.status === 'LIVE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                        'priceValidUntil': auction.endTime,
                        'itemCondition': 'https://schema.org/NewCondition'
                    }
                }}
            />

            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-white font-bold transition-colors mb-8 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl">
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Auctions
            </Link>

            <AnimatePresence>
                {outbid && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="bg-red-500/20 border border-red-500/50 text-red-400 px-6 py-3 rounded-xl mb-6 flex items-center font-semibold"
                    >
                        <AlertTriangle className="w-5 h-5 mr-3" />
                        Someone just outbid you! Place a higher bid to stay in the lead.
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {needsPayment && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-400/40 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">🏆</div>
                            <div>
                                <p className="text-yellow-400 font-black text-xl">You Won This Auction!</p>
                                <p className="text-gray-300 text-sm mt-0.5">Complete your payment within 48 hours to secure your item.</p>
                            </div>
                        </div>
                        <Link href={`/auctions/${id}/pay`}
                            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105">
                            Pay Now →
                        </Link>
                    </motion.div>
                )}
                {orderActive && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <Package className="w-8 h-8 text-green-400" />
                            <div>
                                <p className="text-green-400 font-bold">Payment Complete — Order In Progress</p>
                                <p className="text-gray-400 text-sm">Status: <strong className="text-white capitalize">{auction.status.replace('_', ' ')}</strong></p>
                            </div>
                        </div>
                        <Link href={`/orders/${id}`}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 font-bold rounded-xl hover:bg-green-500/20 transition-colors">
                            <Package className="w-4 h-4" /> Track Order
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-3/5 space-y-6">
                    <div className="relative aspect-video sm:aspect-square lg:aspect-video bg-zinc-950/80 rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group/gallery">
                        <Image
                            src={auction.imageUrls[activeImage] || 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800'}
                            alt={auction.title}
                            fill
                            priority
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/gallery:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent pointer-events-none" />
                        {auction.imageUrls.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImage(prev => (prev - 1 + auction.imageUrls.length) % auction.imageUrls.length)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-black/60 z-10"
                                >
                                    <ArrowLeft className="w-5 h-5 text-white" />
                                </button>
                                <button
                                    onClick={() => setActiveImage(prev => (prev + 1) % auction.imageUrls.length)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-black/60 z-10"
                                >
                                    <ArrowLeft className="w-5 h-5 text-white rotate-180" />
                                </button>
                            </>
                        )}
                        {isLive && (
                            <div className="absolute top-6 left-6 flex items-center bg-red-500/90 text-white text-[10px] font-black tracking-widest uppercase px-4 py-2 rounded-full shadow-lg shadow-red-500/20 backdrop-blur-md">
                                <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" /> LIVE · {auction._count.bids} bids {uniqueBidders > 0 && `· ${uniqueBidders} bidders`}
                            </div>
                        )}
                        <div className="absolute top-6 right-6 flex gap-3">
                            <motion.button
                                whileHover={{ scale: 1.15, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleShare}
                                className="p-2 sm:p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all shadow-lg group"
                            >
                                <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.15, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 sm:p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all shadow-lg text-red-500"
                            >
                                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleWatch}
                                disabled={isWatchingLoading}
                                className={`p-3 rounded-2xl backdrop-blur-xl border transition-all shadow-lg group ${isWatched ? 'bg-red-500/20 border-red-500/40' : 'bg-black/60 border-white/10 hover:bg-white/20'}`}
                            >
                                <motion.div animate={isWatched ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
                                    <Heart className={`w-5 h-5 transition-colors ${isWatched ? 'text-red-500 fill-red-500' : 'text-gray-300 group-hover:text-red-400'}`} />
                                </motion.div>
                            </motion.button>
                        </div>
                    </div>

                    {auction.imageUrls.length > 1 && (
                        <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {auction.imageUrls.map((url, i) => (
                                <button key={i} onClick={() => setActiveImage(i)}
                                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === i ? 'border-yellow-400 scale-105 shadow-[0_6px_15px_-5px_rgba(250,204,21,0.5)]' : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'}`}>
                                    <Image src={url} alt="" fill className="object-cover" sizes="80px" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        <LivePulseFeed />
                        <div>
                            <p className="inline-block bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">{auction.category.name}</p>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight tracking-tighter">{auction.title}</h1>
                            {/* Status badges - scrollable row on mobile */}
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
                                <div className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 ${urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                                    <Activity className="w-3 h-3" />{auction.status}
                                </div>
                                <div className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 border ${wsConnected ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-zinc-800 text-gray-500 border-white/5'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`} />
                                    {wsConnected ? 'LIVE' : 'OFFLINE'}
                                </div>
                                {viewers > 0 && (
                                    <div className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                        {viewers} watching
                                    </div>
                                )}
                            </div>
                            {/* Info pills */}
                            <div className="flex flex-wrap gap-2">
                                <span className="flex items-center gap-1.5 text-blue-400 font-semibold bg-blue-500/10 px-3 py-1.5 rounded-lg text-xs border border-blue-500/20">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Escrow Protected
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-400 font-semibold bg-zinc-900/60 px-3 py-1.5 rounded-lg text-xs border border-white/10">
                                    <Package className="w-3.5 h-3.5" /> Ship ₹{Number(auction.shippingCost).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1.5 text-gray-400 font-semibold bg-zinc-900/60 px-3 py-1.5 rounded-lg text-xs border border-white/10">
                                    👁 {auction.viewCount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-inner mb-4">
                        <h3 className="font-black text-base sm:text-xl mb-3 flex items-center text-white tracking-tight">
                            <Shield className="w-4 h-4 mr-2 text-yellow-400" /> Item Description
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{auction.description}</p>
                    </div>

                    <AuthenticityBadge />

                    <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] flex items-center justify-between hover:bg-zinc-900/60 transition-colors shadow-inner">
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5">Seller</p>
                            <Link href={`/u/${auction.seller.id}`} className="text-white font-black text-xl flex items-center gap-2 hover:text-yellow-400 transition-colors">
                                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs pb-0.5">👤</div>
                                {auction.seller.fullName || 'Anonymous'}
                            </Link>
                            <div className="flex items-center text-yellow-400 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < Math.round(Number(auction.seller.trustScore)) ? 'fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-gray-600'}`} />
                                ))}
                                <span className="text-white font-bold text-sm ml-2">{Number(auction.seller.trustScore).toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {auction.seller.verifiedStatus !== 'BASIC' && (
                                <span className="bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-blue-500/20 flex items-center shadow-lg">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Verified
                                </span>
                            )}
                            {user?.id !== auction.seller.id && (
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                    <button
                                        onClick={toggleFollow}
                                        disabled={isFollowLoading}
                                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isFollowing
                                            ? 'bg-zinc-800 text-gray-400 border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                                            : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                                            }`}
                                    >
                                        {isFollowLoading ? '...' : (isFollowing ? 'Following' : 'Follow Seller')}
                                    </button>
                                    {user && (
                                        <Link
                                            href={`/inbox?with=${auction.seller.id}`}
                                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-white/10 border border-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-all"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" /> Message Seller
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-2/5">
                    <div className="sticky top-20 space-y-4 lg:space-y-6">
                        <div className="bg-zinc-950/80 backdrop-blur-3xl border border-white/10 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-full h-1.5 ${urgent ? 'bg-gradient-to-r from-red-600 via-red-500 to-red-600' : 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500'}`} />
                            <div className={`absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity ${urgent ? 'bg-red-500' : 'bg-yellow-400'}`} />

                            <div className="flex flex-col gap-4 sm:gap-6 relative z-10">
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Current Bid</p>
                                        <AnimatePresence mode="wait">
                                            <motion.h2
                                                key={auction.currentHighestBid}
                                                initial={{ scale: 1.1, y: 10, opacity: 0 }}
                                                animate={{ scale: 1, y: 0, opacity: 1 }}
                                                className="text-3xl sm:text-5xl font-black text-white tracking-tighter"
                                            >
                                                ₹{Number(auction.currentHighestBid).toLocaleString()}
                                            </motion.h2>
                                        </AnimatePresence>
                                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1">
                                            Start: ₹{Number(auction.startingPrice).toLocaleString()}
                                            {(auction as any).retailPrice && (
                                                <span className="ml-3 text-yellow-400/40">Est: ₹{Number((auction as any).retailPrice).toLocaleString()}</span>
                                            )}
                                        </p>
                                    </div>

                                    <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-2xl border backdrop-blur-md transition-all ${urgent ? 'bg-red-500 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/10 text-white'}`}>
                                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 flex items-center justify-end">
                                            <Timer className="w-3 h-3 mr-1" /> {urgent ? 'Closing' : 'Ends In'}
                                        </p>
                                        <p className="text-xl sm:text-2xl font-black tabular-nums tracking-tighter">{time}</p>
                                    </div>
                                </div>

                                <div className="relative">
                                    {pulseEffect && (
                                        <motion.div initial={{ scale: 0.8, opacity: 0.5 }} animate={{ scale: 1.5, opacity: 0 }} className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full" />
                                    )}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {userTotalBids > 0 && (
                                            <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 w-fit">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-black uppercase tracking-wider">Your Total: ₹{userTotalBids.toLocaleString()}</span>
                                            </div>
                                        )}
                                        {user?.id === topBidder && (
                                            <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20 w-fit animate-pulse">
                                                <Star className="w-3.5 h-3.5 fill-green-400" />
                                                <span className="text-[11px] font-black uppercase tracking-wider">You are leading!</span>
                                            </div>
                                        )}
                                        {streakCount > 1 && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-orange-500 text-white px-4 py-1.5 rounded-xl font-black text-[10px] shadow-lg border-2 border-orange-400 flex items-center gap-2 uppercase tracking-widest">
                                                <Zap className="w-3 h-3 fill-white" /> {streakCount} BID STREAK!
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center gap-0.5 sm:gap-1 mt-4 bg-white/5 p-1 rounded-xl border border-white/5">
                                        {['🔥', '🤯', '🚀', '💎', '🤝'].map(emoji => (
                                            <button key={emoji} onClick={() => sendReaction(emoji)} className="p-2 sm:p-3 text-lg sm:text-2xl hover:bg-white/10 rounded-lg transition-all hover:scale-125 active:scale-90">{emoji}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {message && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`mt-3 mb-3 px-4 py-3 rounded-xl text-sm font-semibold ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>{message.text}</motion.div>
                                )}
                            </AnimatePresence>

                            {isLive && !isSeller ? (
                                <>
                                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 mb-3 mt-4 flex items-center gap-3 focus-within:border-yellow-400/50 transition-all">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-white/50">₹</div>
                                        <input type="number" value={bidAmount} onChange={e => setBidAmount(Math.round(Number(e.target.value)))} className="flex-1 bg-transparent text-3xl font-black text-white outline-none min-w-0" />
                                        <div className="text-[10px] font-black text-gray-500 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">≥ ₹{Math.round(minNext).toLocaleString()}</div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {[minNext, minNext + increment, minNext + increment * 5].map(amount => (
                                            <button key={amount} onClick={() => setBidAmount(Math.round(amount))} className="bg-zinc-800/40 border border-white/5 text-[11px] py-3 rounded-xl hover:bg-white/10 transition-all text-white/80 font-black">₹{Math.round(amount).toLocaleString()}</button>
                                        ))}
                                    </div>

                                    {auction.buyItNowPrice && Number(auction.buyItNowPrice) > currentBidAmt && (
                                        <button 
                                            onClick={purchaseNow}
                                            disabled={bidding}
                                            className="w-full mb-4 bg-white text-black py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors shadow-lg"
                                        >
                                            <ShoppingBag className="w-4 h-4" /> Buy Now: ₹{Number(auction.buyItNowPrice).toLocaleString()}
                                        </button>
                                    )}

                                    {availableBalance < bidAmount && (
                                        <div className="mb-4 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between">
                                            <p className="text-gray-400 text-[10px] font-bold">Balance: ₹{availableBalance.toLocaleString()}</p>
                                            <Link href="/dashboard" className="text-red-500 text-[10px] font-black uppercase tracking-widest">Deposit Now</Link>
                                        </div>
                                    )}

                                    {isLive && user?.id !== auction.bids[0]?.bidderId ? (
                                        <SwipeToBid label={availableBalance < bidAmount ? 'Insufficient Balance' : `Swipe to Bid ₹${Math.round(bidAmount).toLocaleString('en-IN')}`} onConfirm={placeBid} disabled={auction.status !== 'LIVE' || (!!user && availableBalance < bidAmount)} confirming={bidding} />
                                    ) : isLive ? (
                                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-center">
                                            <p className="text-green-400 font-black uppercase tracking-[0.1em] text-[10px]">You are leading the hunt</p>
                                        </div>
                                    ) : null}

                                    <div className="mt-5 pt-5 border-t border-white/10 relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 px-3 text-gray-500 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                                            <TrendingUp className="w-3 h-3 text-blue-400" /> Auto-Bid
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-zinc-900/60 border border-white/10 rounded-xl px-3 py-2.5 flex items-center focus-within:border-blue-500/50 transition-all">
                                                <span className="text-gray-500 font-bold mr-2 text-sm">₹</span>
                                                <input type="number" value={maxBid} onChange={e => setMaxBid(e.target.value)} placeholder="Max auto-bid…" className="bg-transparent text-white font-bold outline-none flex-1 min-w-0 placeholder:text-gray-600 text-sm" />
                                            </div>
                                            <button onClick={setAutoBid} className="px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-black hover:bg-blue-500 hover:text-white transition-all whitespace-nowrap">Activate</button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-gray-400">{isSeller ? 'You are the seller of this auction.' : `Auction status: ${displayStatus.replace('_', ' ')}`}</p>
                                </div>
                            )}

                            <p className="text-center text-xs text-gray-600 mt-4 leading-relaxed">By bidding, you commit to purchasing if you win. Funds held in Bidora Escrow.</p>
                        </div>

                        <div className="bg-zinc-900 border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[50px] rounded-full pointer-events-none" />
                            <h3 className="font-black text-white mb-6 flex items-center border-b border-white/10 pb-4 tracking-tight">
                                <Activity className="w-5 h-5 mr-3 text-yellow-400" /> Live Bid Feed
                            </h3>
                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin relative z-10">
                                <AnimatePresence initial={false}>
                                    {bids.length === 0 ? (
                                        <div className="text-center py-10">
                                            <div className="w-16 h-16 bg-white/5 mx-auto rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner"><Zap className="w-8 h-8 text-gray-500" /></div>
                                            <p className="text-gray-400 font-semibold mb-1">No bids placed yet.</p>
                                            <p className="text-gray-600 text-sm">Be the first to secure the lead!</p>
                                        </div>
                                    ) : bids.map((bid, i) => (
                                        <motion.div key={`${bid.amount}-${i}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`flex justify-between items-center text-sm p-4 rounded-2xl border transition-all ${i === 0 ? 'bg-gradient-to-r from-yellow-400/10 to-transparent border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                                            <div className="flex items-center space-x-4">
                                                <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-black border tracking-widest shadow-inner ${i === 0 ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40' : 'bg-zinc-800/80 text-gray-400 border-white/5'}`}>{bid.user?.charAt(0).toUpperCase() || '?'}</span>
                                                <div>
                                                    <p className={`font-bold ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                                        {bid.user || 'Bidder'}
                                                        {bid.isAutoBid && <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 ml-2 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">Auto</span>}
                                                    </p>
                                                    <p className="text-gray-500 text-[11px] font-semibold tracking-wider mt-0.5">{bid.time || 'Just now'}</p>
                                                </div>
                                            </div>
                                            <p className={`font-black text-lg ${i === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>₹{bid.amount.toLocaleString()}</p>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {
                !isLive && (
                    <div className="mt-16 border-t border-white/10 pt-12">
                        <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Seller Reviews
                        </h2>
                        <RatingSection sellerId={auction.seller.id} sellerName={auction.seller.fullName || 'Seller'} auctionId={auction.id} showForm={auction.status === 'COMPLETED' && !!user} canRateUserId={user && user.id !== auction.seller.id ? auction.seller.id : undefined} canRateUserName={user && user.id !== auction.seller.id ? (auction.seller.fullName || 'Seller') : 'Seller'} />
                    </div>
                )
            }

            <AnimatePresence>
                {isLive && !isSeller && (
                    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] p-4 bg-gradient-to-t from-black via-black/95 to-transparent pb-8">
                        <div className="flex items-center justify-between mb-4 px-2">
                             <div className="text-left">
                                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Leading Bid</p>
                                <p className="text-lg font-black text-white">₹{Number(auction.currentHighestBid).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest text-right">Available Balance</p>
                                <p className="text-gray-400 text-xs font-bold text-right">₹{availableBalance.toLocaleString()}</p>
                            </div>
                        </div>
                        <SwipeToBid 
                            label={availableBalance < bidAmount ? 'Insufficient Balance' : `Swipe to Bid ₹${Math.round(bidAmount).toLocaleString('en-IN')}`} 
                            onConfirm={placeBid} 
                            disabled={auction.status !== 'LIVE' || (!!user && availableBalance < bidAmount)} 
                            confirming={bidding} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
