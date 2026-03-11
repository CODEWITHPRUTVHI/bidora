'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Timer, ArrowRight, Loader2, Flame } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';
import { Skeleton, AuctionCardSkeleton } from '@/components/ui/Skeleton';

interface Auction {
    id: string; title: string; imageUrls: string[];
    currentHighestBid: number; startingPrice: number; endTime: string;
    status: string; category: { name: string }; seller: { fullName: string; verifiedStatus: string };
    _count: { bids: number };
}

function CountdownBadge({ endTime }: { endTime: string }) {
    const [time, setTime] = useState('');
    const [urgent, setUrgent] = useState(false);
    useEffect(() => {
        const tick = () => {
            const diff = new Date(endTime).getTime() - Date.now();
            if (diff <= 0) { setTime('ENDED'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setUrgent(diff < 120000);
            setTime(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [endTime]);
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${urgent ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-black/50 text-gray-300 border border-white/10'} backdrop-blur-sm`}>
            <Timer className="w-3 h-3" /> {time}
        </span>
    );
}

function AuctionCard({ auction, idx }: { auction: Auction; idx: number }) {
    const img = auction.imageUrls[0] || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400`;
    return (
        <Link href={`/auctions/${auction.id}`}>
            <motion.article
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden cursor-pointer hover:border-yellow-400/40 hover:shadow-[0_20px_40px_-10px_rgba(250,204,21,0.2)] transition-all duration-500"
            >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800/50">
                    <Image
                        src={img}
                        alt={auction.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    {/* LIVE badge */}
                    {auction.status === 'LIVE' && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-sm shadow-lg shadow-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            LIVE · {auction._count.bids} bids
                        </div>
                    )}

                    {/* Timer */}
                    <div className="absolute top-3 right-3">
                        <CountdownBadge endTime={auction.endTime} />
                    </div>

                    {/* Verified badge */}
                    {auction.seller.verifiedStatus !== 'BASIC' && (
                        <div className="absolute bottom-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center" title="Verified Seller">
                            <span className="text-white text-[10px] font-black">✓</span>
                        </div>
                    )}

                    {/* Caption overlay */}
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
                        <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{auction.category.name}</p>
                        <h3 className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow">{auction.title}</h3>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 flex items-center justify-between border-t border-white/5 bg-zinc-950/30">
                    <div>
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-bold">Current Bid</p>
                        <p className="text-yellow-400 font-black text-xl leading-tight drop-shadow-[0_0_8px_rgba(250,204,21,0.2)]">
                            ₹{Number(auction.currentHighestBid > 0 ? auction.currentHighestBid : auction.startingPrice).toLocaleString()}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-yellow-400/10 group-hover:bg-yellow-400 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] border border-yellow-400/20 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                        <ArrowRight className="w-5 h-5 text-yellow-400 group-hover:text-black transition-colors" />
                    </div>
                </div>
            </motion.article>
        </Link>
    );
}

const FILTERS = ['All', 'Watches', 'Sneakers', 'Fashion', 'Collectibles', 'Art', 'Electronics'];

export default function LiveBidsGrid() {
    const [activeFilter, setActiveFilter] = useState('Sneakers');
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        api.get('/auctions/categories')
            .then(r => {
                const names = r.data.categories.map((c: any) => c.name);
                setCategories(['All', ...names]);
            }).catch(() => { });
    }, []);

    const load = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({ status: 'LIVE', limit: '8', sortBy: 'endTime' });
        api.get(`/auctions?${params}`).then(r => {
            const allAuctions: Auction[] = r.data.auctions;
            if (activeFilter === 'All') setAuctions(allAuctions);
            else setAuctions(allAuctions.filter(a => a.category.name === activeFilter));
        }).catch(() => {
            // Fallback to scheduled if no live auctions
            api.get(`/auctions?status=SCHEDULED&limit=8`).then(r => setAuctions(r.data.auctions)).catch(() => { });
        }).finally(() => setLoading(false));
    }, [activeFilter]);

    useEffect(() => { load(); }, [load]);

    const filterList = categories.length > 1 ? categories.slice(0, 7) : FILTERS;

    return (
        <section id="live-auctions" className="py-24 relative container mx-auto px-6 max-w-7xl">

            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[150px] rounded-full -z-10 pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
                <div>
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">Real-time bidding</p>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-2 flex items-center gap-3">
                        <Flame className="w-8 h-8 md:w-10 md:h-10 text-yellow-400 flex-shrink-0" /> LIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">SNEAKER DROPS</span>
                    </h2>
                    <p className="text-gray-400 font-light max-w-lg text-lg">Mumbai&apos;s hottest kicks — bid before time runs out.</p>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-4 hide-scrollbar z-10 -mx-6 px-6">
                    {filterList.map(f => (
                        <button key={f} onClick={() => setActiveFilter(f)}
                            className={`px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-bold transition-all flex items-center gap-1.5 ${activeFilter === f
                                ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                                : 'bg-zinc-900/50 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                                }`}>
                            {f}
                            {f === 'Sneakers' && <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full tracking-widest">HOT</span>}
                        </button>
                    ))}
                    <Link href="/search"
                        className="p-3 rounded-full bg-zinc-900/50 backdrop-blur-md border border-white/10 text-white hover:bg-yellow-400 hover:border-yellow-400 hover:text-black hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all ml-2"
                        title="Advanced search">
                        <SlidersHorizontal className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10">
                    {[...Array(8)].map((_, i) => (
                        <AuctionCardSkeleton key={i} />
                    ))}
                </div>
            ) : (
                <>
                    <AnimatePresence mode="popLayout">
                        <div className={`grid gap-8 relative z-10 ${auctions.length === 0 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                            {auctions.length === 0 ? (
                                // PRE-LAUNCH TEASER CARDS
                                [
                                    {
                                        id: 't1',
                                        title: "Nike SB Dunk Low 'Jeff Staple Pigeon'",
                                        img: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1000&auto=format&fit=crop",
                                        price: 85000,
                                        category: 'SB Dunk'
                                    },
                                    {
                                        id: 't2',
                                        title: "Air Jordan 1 Retro High OG 'Chicago' (2015)",
                                        img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop",
                                        price: 45000,
                                        category: 'Jordan'
                                    },
                                    {
                                        id: 't3',
                                        title: "Travis Scott x Air Jordan 1 Low 'Canary'",
                                        img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=1000&auto=format&fit=crop",
                                        price: 32000,
                                        category: 'Collabs'
                                    },
                                    {
                                        id: 't4',
                                        title: "Adidas Yeezy Boost 350 V2 'Zebra'",
                                        img: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=1000&auto=format&fit=crop",
                                        price: 18000,
                                        category: 'Yeezy'
                                    },
                                    {
                                        id: 't5',
                                        title: "Air Jordan 4 Retro 'Military Blue' (2024)",
                                        img: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=1000&auto=format&fit=crop",
                                        price: 24000,
                                        category: 'Jordan'
                                    },
                                    {
                                        id: 't6',
                                        title: "Union LA x Air Jordan 1 Retro High 'Storm Blue'",
                                        img: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=1000&auto=format&fit=crop",
                                        price: 55000,
                                        category: 'Jordan'
                                    }
                                ].map((teaser, idx) => (
                                    <motion.article
                                        key={teaser.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                        whileHover={{ y: -8 }}
                                        className="group relative bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                                    >
                                        <div className="relative aspect-[4/3] bg-zinc-800">
                                            <Image
                                                src={teaser.img}
                                                alt={teaser.title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                            <div className="absolute top-3 left-3 flex flex-col gap-2 scale-90 origin-top-left">
                                                <div className="bg-yellow-400 text-black text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg w-fit">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                                                    DROPPING SOON
                                                </div>
                                                <div className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full border border-white/20 w-fit">
                                                    Next Drop: Friday 8:00 PM
                                                </div>
                                            </div>

                                            <div className="absolute bottom-4 left-4 right-4">
                                                <p className="text-yellow-400 text-[9px] font-black uppercase tracking-widest mb-1">{teaser.category}</p>
                                                <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{teaser.title}</h3>
                                            </div>
                                        </div>

                                        <div className="px-5 py-4 flex items-center justify-between border-t border-white/5 bg-zinc-950/40">
                                            <div>
                                                <p className="text-yellow-400 text-[9px] uppercase tracking-wider font-bold">Opening Bid</p>
                                                <p className="text-white font-black text-lg leading-tight">₹{teaser.price.toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const btn = document.activeElement as HTMLButtonElement;
                                                    if (btn) {
                                                        const originalContent = btn.innerHTML;
                                                        btn.innerHTML = 'NOTIFIED ✓';
                                                        btn.classList.add('text-green-400', 'border-green-400/30');
                                                        setTimeout(() => {
                                                            btn.innerHTML = originalContent;
                                                            btn.classList.remove('text-green-400', 'border-green-400/30');
                                                        }, 2000);
                                                    }
                                                }}
                                                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-black hover:border-yellow-400 transition-all active:scale-95 whitespace-nowrap"
                                            >
                                                Notify Me
                                            </button>
                                        </div>
                                    </motion.article>
                                ))
                            ) : (
                                auctions.map((auction, idx) => (
                                    <AuctionCard key={auction.id} auction={auction} idx={idx} />
                                ))
                            )}
                        </div>
                    </AnimatePresence>

                    <div className="mt-16 text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="bg-yellow-400/5 border border-yellow-400/20 rounded-2xl p-8 max-w-2xl mx-auto"
                        >
                            <h4 className="text-xl font-black text-white mb-2">WHICH ONE DO YOU WANT?</h4>
                            <p className="text-gray-400 text-sm mb-6 uppercase tracking-[0.2em]">Join 12,000+ hunters waiting for the first drop.</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/search?status=SCHEDULED"
                                    className="px-8 py-4 bg-yellow-400 text-black font-black rounded-2xl hover:-translate-y-1 transition-all shadow-[0_10px_30px_-5px_rgba(250,204,21,0.4)]">
                                    VIEW ALL UPCOMING
                                </Link>
                                <Link href="/dashboard?tab=notifs"
                                    className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all">
                                    MANAGE ALERTS
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </section>
    );
}
