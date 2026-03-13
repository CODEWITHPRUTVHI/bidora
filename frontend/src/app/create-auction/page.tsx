'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Upload, Plus, X, Calendar, DollarSign,
    Package, Tag, AlertCircle, CheckCircle2, Image as ImageIcon, Zap, Sparkles, Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';

interface Category { id: number; name: string; slug: string }

const INPUT = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/10 transition-all";
const LABEL = "block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2";

export default function CreateAuctionPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1); // 1=details, 2=media, 3=pricing, 4=review
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageUrls, setImageUrls] = useState<string[]>([]);


    const [form, setForm] = useState({
        title: '',
        description: '',
        categoryId: '',
        startingPrice: '',
        reservePrice: '',
        bidIncrement: '100',
        startTime: '',
        endTime: '',
        durationValue: '60', // Default 60 mins
        isImmediate: true,
        isConfirmed: false,
        shippingCost: '0',
        buyItNowPrice: '',
        retailPrice: ''
    });

    // Auto-assign category based on title keywords
    useEffect(() => {
        if (form.title && categories.length > 0) {
            const lowerTitle = form.title.toLowerCase();
            
            const findAndSet = (catName: string) => {
                const cat = categories.find(c => c.name === catName);
                if (cat) setForm(prev => ({ ...prev, categoryId: cat.id.toString() }));
                return !!cat;
            };

            if (['shoe', 'sneaker', 'nike', 'jordan', 'adidas', 'yeezy', 'kicks', 'footwear'].some(k => lowerTitle.includes(k))) {
                if (findAndSet('Sneakers')) return;
            }
            
            if (['phone', 'iphone', 'laptop', 'macbook', 'samsung', 'pro', 'tech', 'gadget', 'pixel', 'ipad', 'm1', 'm2', 'm3'].some(k => lowerTitle.includes(k))) {
                 if (findAndSet('Electronics')) return;
            }

            if (['rolex', 'omega', 'patek', 'casio', 'seiko', 'tissot', 'watch', 'chronograph'].some(k => lowerTitle.includes(k))) {
                 if (findAndSet('Watches')) return;
            }

            if (['car', 'bike', 'motorcycle', 'scooter', 'ev', 'tesla', 'bmw', 'audi', 'mercedes', 'honda', 'toyota'].some(k => lowerTitle.includes(k))) {
                 if (findAndSet('Vehicles')) return;
            }

            if (['dress', 'shirt', 'jacket', 'gucci', 'lv', 'fashion', 'prada', 'zara', 'h&m'].some(k => lowerTitle.includes(k))) {
                 if (findAndSet('Fashion')) return;
            }

            if (['card', 'pokémon', 'pokemon', 'comic', 'collectible', 'limited', 'signed'].some(k => lowerTitle.includes(k))) {
                 if (findAndSet('Collectibles')) return;
            }
        }
    }, [form.title, categories]);

    useEffect(() => {
        if (!user) router.push('/auth');
        if (user && user.verifiedStatus === 'BASIC') {
            // BASIC users can still create: backend will gate by role
        }
        api.get('/auctions/categories')
            .then(r => setCategories(r.data.categories))
            .catch(() => { });
    }, [user]);

    const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

    const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));


    const handleSubmit = async () => {
        setError('');
        const calculatedStartTime = form.isImmediate ? new Date().toISOString() : form.startTime;
        let calculatedEndTime = form.endTime;

        if (form.isImmediate && form.durationValue !== 'manual') {
            const end = new Date();
            end.setMinutes(end.getMinutes() + Number(form.durationValue));
            calculatedEndTime = end.toISOString();
        }

        if (!calculatedEndTime) return setError('End time is required.');

        setLoading(true);
        try {
            const res = await api.post('/auctions', {
                title: form.title,
                description: form.description,
                categoryId: Number(form.categoryId),
                startingPrice: Number(form.startingPrice),
                reservePrice: form.reservePrice ? Number(form.reservePrice) : undefined,
                buyItNowPrice: form.buyItNowPrice ? Number(form.buyItNowPrice) : undefined,
                retailPrice: form.retailPrice ? Number(form.retailPrice) : undefined,
                bidIncrement: Number(form.bidIncrement),
                startTime: calculatedStartTime,
                endTime: calculatedEndTime,
                shippingCost: Number(form.shippingCost),
                imageUrls
            });
            router.push(`/auctions/${res.data.auction.id}`);
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to create auction. Please try again.');
            setStep(1);
        } finally { setLoading(false); }
    };

    const steps = [
        { n: 1, label: 'Details', icon: Tag },
        { n: 2, label: 'Media', icon: ImageIcon },
        { n: 3, label: 'Pricing', icon: DollarSign },
        { n: 4, label: 'Review', icon: CheckCircle2 }
    ];

    const minEndDate = () => {
        const d = new Date(); d.setHours(d.getHours() + 1);
        return d.toISOString().slice(0, 16);
    };

    return (
        <div className="min-h-screen py-16 px-4" >
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                </Link>

                <div className="mb-10">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Create <span className="text-yellow-400">Auction</span></h1>
                    <p className="text-gray-400">List your item for live bidding on Bidora.</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center mb-10">
                    {steps.map((s, i) => {
                        const Icon = s.icon;
                        const active = s.n === step;
                        const done = s.n < step;
                        return (
                            <div key={s.n} className="flex items-center flex-1">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${active ? 'bg-yellow-400 text-black font-bold' : done ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'}`}>
                                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                    <span className="text-xs font-semibold hidden sm:block">{s.label}</span>
                                </div>
                                {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${done ? 'bg-yellow-400/50' : 'bg-white/10'}`} />}
                            </div>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </motion.div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400/60 to-yellow-600/60" />

                    {user?.verifiedStatus === 'BASIC' ? (
                        <div className="text-center py-12 px-6">
                            <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-400/20 shadow-inner">
                                <AlertCircle className="w-10 h-10 text-yellow-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-3">Verification Required</h2>
                            <p className="text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">To list items on Bidora, you must first verify your account. This helps build a safe and trusted community for all bidders.</p>
                            <Link href="/dashboard?tab=verify" className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-3.5 rounded-xl font-black transition-all shadow-[0_10px_30px_-10px_rgba(250,204,21,0.5)]">
                                <CheckCircle2 className="w-5 h-5" /> Get Verified Now
                            </Link>
                        </div>
                    ) : (
                        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>


                        {/* ── Step 1: Details ─────────────────────────── */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2"><Tag className="w-6 h-6 text-yellow-400" /> Item Details</h2>
                                </div>


                                <div>
                                    <label className={LABEL}>Title *</label>
                                    <input value={form.title} onChange={e => update('title', e.target.value)}
                                        placeholder="e.g. Nike Air Jordan 1 Chicago OG (Size 10)"
                                        className={INPUT} maxLength={120} />
                                    <p className="text-gray-600 text-xs mt-1.5 text-right">{form.title.length}/120</p>
                                </div>
                                <div>
                                    <label className={LABEL}>Description *</label>
                                    <textarea value={form.description} onChange={e => update('description', e.target.value)}
                                        placeholder="Describe your item in detail — condition, provenance, size, accessories included…"
                                        rows={5} className={INPUT + ' resize-none'} maxLength={2000} />
                                    <p className="text-gray-600 text-xs mt-1.5 text-right">{form.description.length}/2000</p>
                                </div>
                                <div>
                                    <label className={LABEL}>Category *</label>
                                    <select value={form.categoryId} onChange={e => update('categoryId', e.target.value)} className={INPUT}>
                                        <option value="">Select a category…</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* ── Step 2: Media ──────────────────────────── */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2"><ImageIcon className="w-6 h-6 text-yellow-400" /> Item Photos</h2>
                                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-2xl p-4 flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-white font-bold mb-1">Upload High-Quality Photos</p>
                                        <p className="text-gray-400 leading-relaxed">Upload your photos in <strong className="text-yellow-400">any size or aspect ratio</strong>. Our system will automatically format them for the perfect presentation. Clear lighting and neutral backgrounds increase bids by 30%.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center justify-center w-full px-4 py-8 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl hover:bg-white/10 hover:border-yellow-400/50 transition-colors cursor-pointer group">
                                        <div className="text-center">
                                            {loading ? <Loader2 className="w-10 h-10 text-yellow-400 mx-auto mb-3 animate-spin" /> : <Upload className="w-10 h-10 text-gray-500 group-hover:text-yellow-400 mx-auto mb-3 transition-colors" />}
                                            <p className="text-white font-semibold mb-1">{loading ? 'Uploading...' : 'Click to Upload Photos'}</p>
                                            <p className="text-gray-500 text-xs text-center">JPG, PNG up to 5MB (Max 5 photos)</p>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" multiple disabled={loading || imageUrls.length >= 5} onChange={async e => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length === 0) return;

                                            setLoading(true);
                                            try {
                                                const formData = new FormData();
                                                files.forEach(f => formData.append('images', f));

                                                const res = await api.post('/upload', formData, {
                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                });

                                                if (res.data.urls) {
                                                    setImageUrls(p => [...p, ...res.data.urls].slice(0, 5));
                                                }
                                            } catch (err) {
                                                console.error(err);
                                                window.alert("Failed to upload images. Please check the network.");
                                            } finally {
                                                setLoading(false);
                                            }
                                        }} />
                                    </label>
                                </div>

                                {imageUrls.length === 0 && !loading ? (
                                    <div className="text-center pt-2">
                                        <p className="text-gray-500 text-sm">No photos uploaded yet</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {imageUrls.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group bg-black/50">
                                                <Image src={url} alt={`Preview ${i + 1}`} fill className="object-contain" sizes="(max-width: 640px) 50vw, 20vw" />
                                                <button onClick={() => removeImage(i)}
                                                    className="absolute top-2 right-2 w-8 h-8 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10">
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                                {i === 0 && <span className="absolute bottom-2 left-2 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black px-2 py-1 rounded-md shadow-lg z-10">Cover</span>}
                                            </div>
                                        ))}
                                        {loading && (
                                            <div className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Step 3: Pricing & Timing ───────────────── */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-yellow-400" /> Pricing & Schedule</h2>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={LABEL}>Starting Price (₹) *</label>
                                        <input type="number" min="1" value={form.startingPrice} onChange={e => update('startingPrice', e.target.value)}
                                            placeholder="500" className={INPUT} />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Buy It Now Price (₹) <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                                        <input type="number" min="1" value={form.buyItNowPrice} onChange={e => update('buyItNowPrice', e.target.value)}
                                            placeholder="Instant buy price" className={INPUT} />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Suggested Price / MSRP (₹) <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                                        <input type="number" min="1" value={form.retailPrice} onChange={e => update('retailPrice', e.target.value)}
                                            placeholder="Retail Price" className={INPUT} />
                                    </div>
                                    <div>
                                        <label className={LABEL}>Reserve Price (₹) <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
                                        <input type="number" min="1" value={form.reservePrice} onChange={e => update('reservePrice', e.target.value)}
                                            placeholder="Hidden minimum price" className={INPUT} />
                                    </div>

                                    <div>
                                        <label className={LABEL}>Bid Increment (₹)</label>
                                        <input type="number" min="1" value={form.bidIncrement} onChange={e => update('bidIncrement', e.target.value)}
                                            placeholder="100" className={INPUT} />
                                        <p className="text-gray-600 text-xs mt-1.5">Minimum raise per bid</p>
                                    </div>
                                    <div>
                                        <label className={LABEL}>Shipping Cost (₹)</label>
                                        <input type="number" min="0" value={form.shippingCost} onChange={e => update('shippingCost', e.target.value)}
                                            placeholder="0 = Free shipping" className={INPUT} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={LABEL}>Start Option</label>
                                        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-max">
                                            <button
                                                onClick={() => update('isImmediate', 'true' as any)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${form.isImmediate ? 'bg-yellow-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Start Now
                                            </button>
                                            <button
                                                onClick={() => update('isImmediate', 'false' as any)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!form.isImmediate ? 'bg-yellow-400 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                Schedule Later
                                            </button>
                                        </div>
                                    </div>

                                    {form.isImmediate ? (
                                        <div>
                                            <label className={LABEL}>Auction Duration</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {[
                                                    { label: '10 Mins', value: '10' },
                                                    { label: '30 Mins', value: '30' },
                                                    { label: '1 Hour', value: '60' },
                                                    { label: '6 Hours', value: '360' },
                                                    { label: '24 Hours', value: '1440' }
                                                ].map(p => (
                                                    <button
                                                        key={p.value}
                                                        onClick={() => update('durationValue', p.value)}
                                                        className={`px-3 py-2.5 rounded-xl border text-[10px] uppercase font-black tracking-widest transition-all ${form.durationValue === p.value ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/5 text-gray-400 hover:border-white/10'}`}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => update('durationValue', 'manual')}
                                                    className={`col-span-2 px-3 py-2.5 rounded-xl border text-[10px] uppercase font-black tracking-widest transition-all ${form.durationValue === 'manual' ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/5 text-gray-400 hover:border-white/10'}`}
                                                >
                                                    Set Custom End Time
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className={LABEL}>Scheduled Start Date & Time</label>
                                            <input type="datetime-local" value={form.startTime} onChange={e => update('startTime', e.target.value)}
                                                min={new Date().toISOString().slice(0, 16)}
                                                className={INPUT + ' [color-scheme:dark]'} />
                                        </div>
                                    )}

                                    {(!form.isImmediate || form.durationValue === 'manual') && (
                                        <div>
                                            <label className={LABEL}>End Date & Time *</label>
                                            <input type="datetime-local" value={form.endTime} onChange={e => update('endTime', e.target.value)}
                                                min={minEndDate()}
                                                className={INPUT + ' [color-scheme:dark]'} />
                                        </div>
                                    )}
                                </div>

                                {/* Platform fee notice */}
                                <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 text-sm text-gray-400">
                                    <p className="font-semibold text-yellow-400 mb-1 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> Platform Commission
                                    </p>
                                    Bidora charges a <strong className="text-white">7% commission</strong> on the final sale price, deducted from escrow when the auction completes.
                                </div>
                            </div>
                        )}

                        {/* ── Step 4: Review ─────────────────────────── */}
                        {step === 4 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-yellow-400" /> Review & Publish</h2>

                                <div className="bg-black/40 rounded-2xl border border-white/10 overflow-hidden">
                                    {imageUrls[0] && (
                                        <div className="relative w-full h-52 bg-black/50">
                                            <Image src={imageUrls[0]} alt="Cover" fill className="object-contain" />
                                        </div>
                                    )}
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <p className="text-gray-500 text-xs">{categories.find(c => c.id === Number(form.categoryId))?.name || '—'}</p>
                                            <h3 className="text-xl font-black text-white mt-1">{form.title || '—'}</h3>
                                            <p className="text-gray-400 text-sm mt-2 line-clamp-3">{form.description || '—'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                                            {[
                                                { label: 'Starting At', value: `₹${Number(form.startingPrice || 0).toLocaleString()}` },
                                                { label: 'Sug. Retail', value: form.retailPrice ? `₹${Number(form.retailPrice).toLocaleString()}` : '—' },
                                                { label: 'Bid Increment', value: `₹${Number(form.bidIncrement || 0).toLocaleString()}` },
                                                { label: 'Shipping', value: Number(form.shippingCost) === 0 ? 'Free' : `₹${Number(form.shippingCost).toLocaleString()}` },
                                                { label: 'Ends', value: form.endTime ? new Date(form.endTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }
                                            ].map(item => (
                                                <div key={item.label}>
                                                    <p className="text-gray-500 text-xs">{item.label}</p>
                                                    <p className="text-white font-bold mt-0.5">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-2xl p-6 text-sm text-yellow-100 flex gap-4">
                                    <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-black uppercase tracking-widest text-[10px] mb-2 text-yellow-400">Final Confirmation</p>
                                        <div className="leading-relaxed">Please review all details carefully. Once published:
                                            <ul className="list-disc ml-4 mt-2 space-y-1 opacity-80">
                                                <li>Starting price and reserve price cannot be changed.</li>
                                                <li>The auction duration and start/end times are final.</li>
                                                <li>You agree to ship the item within 48 hours of payment.</li>
                                            </ul>
                                        </div>
                                        <label className="mt-6 flex items-center gap-3 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input type="checkbox" checked={form.isConfirmed} onChange={e => setForm(p => ({ ...p, isConfirmed: e.target.checked }))} className="peer w-6 h-6 bg-black/40 border border-yellow-400/50 rounded-lg appearance-none checked:bg-yellow-400 transition-all" />
                                                <CheckCircle2 className="absolute w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                            </div>
                                            <span className="font-black uppercase tracking-tighter text-xs group-hover:text-white transition-colors">I confirm all details are correct</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                                    <button onClick={() => setStep(s => Math.max(s - 1, 1))} disabled={step === 1}
                                        className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-semibold hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                        Back
                                    </button>

                                    {step < 4 ? (
                                        <button onClick={() => {
                                            if (step === 1 && (!form.title || !form.description || !form.categoryId)) return setError('Please complete all required fields.');
                                            if (step === 3) {
                                                if (form.isImmediate) {
                                                    if (form.durationValue === 'manual' && !form.endTime) return setError('Please set an end time.');
                                                    if (form.durationValue !== 'manual') {
                                                        const end = new Date();
                                                        end.setMinutes(end.getMinutes() + Number(form.durationValue));
                                                        setForm(p => ({ ...p, endTime: end.toISOString() }));
                                                    }
                                                } else {
                                                    if (!form.startTime || !form.endTime) return setError('Start and end times are required.');
                                                }
                                            }
                                            setError(''); setStep(s => s + 1);
                                        }}
                                            className="px-8 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors hover:scale-105">
                                            Continue →
                                        </button>
                                    ) : (
                                        <button onClick={handleSubmit} disabled={loading || !form.isConfirmed}
                                            className="px-8 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                                            {loading ? <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Zap className="w-5 h-5" />}
                                            {loading ? 'Publishing…' : 'Publish Auction'}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                </div>
            </div>
        </div>
    );
}

