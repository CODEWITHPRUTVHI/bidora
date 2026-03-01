'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Flame, Timer, TrendingUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/axios';

interface Auction {
    id: string; title: string; description: string; imageUrls: string[];
    currentHighestBid: number; startingPrice: number; endTime: string;
    status: string; bidCount: number;
    seller: { fullName: string; verifiedStatus: string; trustScore: number };
    category: { id: number; name: string; slug: string };
    _count: { bids: number };
}
interface Category { id: number; name: string; slug: string; _count: { auctions: number } }

function useCountdown(endTime: string) {
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
    return { time, urgent };
}

function AuctionSearchCard({ auction }: { auction: Auction }) {
    const { time, urgent } = useCountdown(auction.endTime);
    const img = auction.imageUrls[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

    return (
        <Link href={`/auctions/${auction.id}`}>
            <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="group bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-yellow-400/30 hover:shadow-[0_15px_30px_-15px_rgba(250,204,21,0.2)] transition-all duration-300 cursor-pointer"
            >
                <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={img} alt={auction.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                    {auction.status === 'LIVE' && (
                        <div className="absolute top-4 left-4 flex items-center bg-red-500/90 text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 animate-pulse" /> LIVE
                        </div>
                    )}

                    <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-md shadow-lg border ${urgent ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-black/60 border-white/10 text-gray-300'}`}>
                        <Timer className="w-3.5 h-3.5" />
                        {time}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white font-black text-xl leading-tight line-clamp-2 drop-shadow-md tracking-tight">{auction.title}</p>
                    </div>
                </div>

                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Current Bid</p>
                            <p className="text-yellow-400 font-black text-2xl drop-shadow-sm">
                                ₹{Number(auction.currentHighestBid || auction.startingPrice).toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-xs font-bold bg-white/5 px-2 py-1 rounded-md inline-block">{auction._count.bids} bids</p>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mt-1.5">{auction.category.name}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <p className="text-gray-400 text-xs font-medium truncate max-w-[60%] flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] pb-px">👤</span>
                            {auction.seller.fullName || 'Anonymous'}
                        </p>
                        {auction.seller.verifiedStatus !== 'BASIC' && (
                            <span className="text-[10px] text-blue-400 font-bold tracking-wider uppercase bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md shadow-sm">Verified</span>
                        )}
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

const SORT_OPTIONS = [
    { value: 'endTime:asc', label: 'Ending Soonest' },
    { value: 'currentHighestBid:desc', label: 'Highest Bid' },
    { value: 'currentHighestBid:asc', label: 'Lowest Bid' },
    { value: 'createdAt:desc', label: 'Newest' },
    { value: 'bidCount:desc', label: 'Most Bids' }
];

const STATUS_OPTIONS = [
    { value: 'LIVE', label: '🔴 Live Now' },
    { value: 'SCHEDULED', label: '📅 Upcoming' },
    { value: 'ENDED', label: '✅ Ended' }
];

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [status, setStatus] = useState(searchParams.get('status') || 'LIVE');
    const [categoryId, setCategoryId] = useState(searchParams.get('cat') || '');
    const [sort, setSort] = useState('endTime:asc');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });
    const [loading, setLoading] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Load categories once
    useEffect(() => {
        api.get('/auctions/categories').then(r => setCategories(r.data.categories)).catch(() => { });
    }, []);

    const doSearch = useCallback(async (page = 1) => {
        setLoading(true);
        const [sortBy, order] = sort.split(':');
        try {
            const params = new URLSearchParams();
            if (query) params.set('q', query);
            if (status) params.set('status', status);
            if (categoryId) params.set('categoryId', categoryId);
            if (sortBy) params.set('sortBy', sortBy);
            if (order) params.set('order', order);
            if (minPrice) params.set('minPrice', minPrice);
            if (maxPrice) params.set('maxPrice', maxPrice);
            params.set('page', String(page));
            params.set('limit', '12');

            const res = await api.get(`/auctions/search?${params.toString()}`);
            setAuctions(res.data.auctions);
            setPagination(res.data.pagination);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [query, status, categoryId, sort, minPrice, maxPrice]);

    useEffect(() => { doSearch(1); }, [status, categoryId, sort]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); doSearch(1); };

    return (
        <div className="container mx-auto px-4 md:px-8 py-24 max-w-7xl relative min-h-screen">
            <div className="absolute top-20 right-1/4 w-[30vw] h-[30vw] bg-yellow-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="mb-10 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2">
                    Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm">Auctions</span>
                </h1>
                <p className="text-gray-400 font-medium">Browse {pagination.total.toLocaleString()} rare items across all categories</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-8">
                <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search items, brands, collectibles…"
                        className="w-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white placeholder:text-gray-500 outline-none focus:border-yellow-400/50 focus:bg-zinc-950 focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]"
                    />
                    {query && (
                        <button type="button" onClick={() => { setQuery(''); doSearch(1); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button type="submit" className="px-8 py-4 bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 font-black rounded-2xl hover:-translate-y-0.5 active:scale-95 transition-all shadow-[0_10px_20px_-10px_rgba(250,204,21,0.5)] border border-yellow-300">
                    Search
                </button>
                <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}
                    className={`px-5 rounded-2xl border transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold shadow-md ${filtersOpen ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]' : 'bg-zinc-900/60 backdrop-blur-xl border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}>
                    <SlidersHorizontal className="w-5 h-5" />
                    <span className="hidden sm:block">Filters</span>
                </button>
            </form>

            {/* Filter Panel */}
            <AnimatePresence>
                {filtersOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="bg-zinc-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
                        <div>
                            <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-2">Min Price (₹)</label>
                            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0"
                                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold outline-none focus:border-yellow-400/50 focus:bg-zinc-950 transition-colors" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-2">Max Price (₹)</label>
                            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="No limit"
                                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold outline-none focus:border-yellow-400/50 focus:bg-zinc-950 transition-colors" />
                        </div>
                        <div>
                            <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-2">Category</label>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold outline-none focus:border-yellow-400/50 focus:bg-zinc-950 transition-colors cursor-pointer appearance-none">
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c._count.auctions})</option>)}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={() => { setMinPrice(''); setMaxPrice(''); setCategoryId(''); setQuery(''); doSearch(1); }}
                                className="w-full py-3 px-4 bg-white/5 border border-white/10 text-gray-300 rounded-xl text-sm font-bold hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm">
                                Clear All Filters
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Status + Sort Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex gap-2 flex-wrap bg-zinc-900/50 p-1.5 rounded-2xl border border-white/10">
                    {STATUS_OPTIONS.map(s => (
                        <button key={s.value} onClick={() => setStatus(s.value)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${status === s.value ? 'bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 shadow-[0_5px_15px_-5px_rgba(250,204,21,0.5)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className="relative min-w-[200px]">
                    <select value={sort} onChange={e => setSort(e.target.value)}
                        className="w-full appearance-none bg-zinc-900/60 backdrop-blur-md border border-white/10 text-white font-bold text-sm rounded-2xl pl-5 pr-10 py-3.5 outline-none focus:border-yellow-400/50 cursor-pointer shadow-sm hover:border-white/20 transition-colors">
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-zinc-900">{o.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden animate-pulse">
                            <div className="aspect-[4/3] bg-zinc-800/50" />
                            <div className="p-5 space-y-4">
                                <div className="h-5 bg-white/10 rounded-md w-3/4" />
                                <div className="h-8 bg-white/10 rounded-md w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : auctions.length === 0 ? (
                <div className="text-center py-24">
                    <p className="text-6xl mb-6">🔍</p>
                    <h3 className="text-2xl font-bold text-white mb-2">No auctions found</h3>
                    <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
                    <button onClick={() => { setQuery(''); setStatus('LIVE'); setCategoryId(''); doSearch(1); }}
                        className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors">
                        View All Live Auctions
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {auctions.map((auction, i) => (
                                <motion.div key={auction.id}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.04, duration: 0.3 }}>
                                    <AuctionSearchCard auction={auction} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center gap-2 mt-10">
                            {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button key={p} onClick={() => doSearch(p)}
                                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${p === pagination.page ? 'bg-yellow-400 text-black' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" /></div>}>
            <SearchContent />
        </Suspense>
    );
}
