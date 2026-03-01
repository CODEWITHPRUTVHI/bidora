'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Shield, ArrowLeft, CheckCircle2, Wallet, AlertTriangle,
    Timer, Package, Lock, Zap, ArrowRight, MapPin, Plus
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';

interface Auction {
    id: string; title: string; imageUrls: string[];
    currentHighestBid: number; shippingCost: number; commissionRate: number;
    status: string; endTime: string;
    seller: { fullName: string };
    escrowPayment?: { status: string; amount: number };
}

interface Address {
    id: string; fullName: string; line1: string; line2?: string;
    city: string; state: string; pincode: string; country: string; phone?: string;
}

export default function PaymentPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    const [auction, setAuction] = useState<Auction | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'review' | 'confirm' | 'done'>('review');
    const [deadline, setDeadline] = useState('');

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [addingAddress, setAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'IN' });

    useEffect(() => {
        if (!user) { router.push('/auth'); return; }
        api.get(`/auctions/${id}`).then(res => {
            const a = res.data.auction;
            setAuction(a);
            if (a.status !== 'PAYMENT_PENDING') {
                if (a.status === 'PAID' || a.status === 'SHIPPED' || a.status === 'DELIVERED' || a.status === 'COMPLETED') {
                    setStep('done'); setPaid(true);
                }
            }
            // Payment deadline = 48h after auction ended
            const endDate = new Date(a.endTime);
            endDate.setHours(endDate.getHours() + 48);
            setDeadline(endDate.toLocaleString('en-IN', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }));
        }).catch(() => setError('Auction not found.')).finally(() => setLoading(false));

        api.get('/shipping/address').then(res => {
            const list = res.data.addresses || [];
            if (list.length > 0) {
                setAddresses(list);
                setSelectedAddressId(list[0].id);
            }
        }).catch(() => console.error('Failed to load addresses'));
    }, [id, user]);

    const handleAddAddress = async () => {
        try {
            const res = await api.post('/shipping/address', newAddress);
            const added = res.data.address;
            setAddresses([added, ...addresses]);
            setSelectedAddressId(added.id);
            setAddingAddress(false);
            setNewAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'IN' });
        } catch (e: any) {
            setError(e.response?.data?.error || 'Failed to add address');
        }
    };

    const handlePay = async () => {
        if (!auction) return;
        if (!selectedAddressId) {
            setError('Please select or add a delivery address to continue.');
            return;
        }

        setPaying(true);
        setError('');
        try {
            await api.post(`/wallet/pay-auction`, { auctionId: id, addressId: selectedAddressId });
            await refreshUser();  // Update navbar wallet balance
            setPaid(true);
            setStep('done');
        } catch (e: any) {
            setError(e.response?.data?.error || 'Payment failed. Check your wallet balance and try again.');
            setPaying(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!auction) return (
        <div className="min-h-screen flex items-center justify-center text-gray-400">Auction not found.</div>
    );

    const bidAmount = Number(auction.currentHighestBid);
    const shipping = Number(auction.shippingCost);
    const commission = 0; // Paid by seller
    const total = bidAmount + shipping;
    const walletBal = Number(user?.walletBalance || 0) - Number(user?.pendingFunds || 0);
    const canAfford = walletBal >= total;

    return (
        <div className="min-h-screen py-16 px-4 pb-32">
            <div className="max-w-2xl mx-auto">

                {/* Back */}
                <Link href={`/auctions/${id}`} className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-10 group">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Auction
                </Link>

                {/* ── DONE STATE ──────────────────────────────── */}
                {step === 'done' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-16"
                    >
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                            className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                        </motion.div>
                        <h1 className="text-4xl font-black text-white mb-3">Payment Successful! 🎉</h1>
                        <p className="text-gray-400 text-lg mb-2">
                            <strong className="text-white">₹{total.toLocaleString()}</strong> has been held in escrow.
                        </p>
                        <p className="text-gray-500 text-sm mb-10">
                            Your funds are protected. The seller has been notified and will ship your item shortly.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href={`/orders/${id}`}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                                <Package className="w-5 h-5" /> Track Order <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/dashboard"
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                                Go to Dashboard
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* ── PAYMENT REVIEW + CONFIRM ─────────────── */}
                {step !== 'done' && (
                    <>
                        <div className="mb-8">
                            <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-2">Secure Checkout</p>
                            <h1 className="text-4xl font-black tracking-tighter">Complete <span className="text-yellow-400">Purchase</span></h1>
                        </div>

                        {/* Item Card */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6 flex">
                            <img
                                src={auction.imageUrls[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                                alt={auction.title}
                                className="w-28 h-28 object-cover flex-shrink-0"
                            />
                            <div className="p-4 flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-1">You Won This Auction</p>
                                <h3 className="font-black text-white text-lg leading-tight line-clamp-2">{auction.title}</h3>
                                <p className="text-gray-400 text-sm mt-1">Seller: {auction.seller.fullName || 'Anonymous'}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Shield className="w-3 h-3" /> Escrow Protected
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Deadline Warning */}
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
                            <Timer className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-orange-400 font-semibold text-sm">Payment Deadline</p>
                                <p className="text-gray-400 text-xs mt-0.5">Pay by <strong className="text-white">{deadline}</strong> or this auction will be cancelled and you may lose bidding privileges.</p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                            <h3 className="font-bold text-lg mb-5">Order Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Winning Bid</span>
                                    <span className="text-white font-semibold">₹{bidAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Shipping</span>
                                    <span className="text-white font-semibold">{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString()}`}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500 italic">
                                    <span>Platform Commission (7%)</span>
                                    <span>Paid by Seller</span>
                                </div>
                                <div className="border-t border-white/10 pt-4 flex justify-between">
                                    <span className="font-bold text-white text-lg">Total Due</span>
                                    <span className="font-black text-yellow-400 text-2xl">₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address Selection */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-yellow-400" /> Delivery Address</h3>
                                {!addingAddress && (
                                    <button onClick={() => setAddingAddress(true)} className="text-yellow-400 hover:text-yellow-300 text-sm font-bold flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add New
                                    </button>
                                )}
                            </div>

                            {addingAddress ? (
                                <div className="bg-zinc-900/60 p-4 rounded-xl border border-white/10 space-y-3">
                                    <h4 className="font-bold text-white mb-2 text-sm">Add New Address</h4>
                                    <input placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                    <input placeholder="Phone" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                    <input placeholder="Address Line 1" value={newAddress.line1} onChange={e => setNewAddress({ ...newAddress, line1: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                    <input placeholder="Address Line 2 (Optional)" value={newAddress.line2} onChange={e => setNewAddress({ ...newAddress, line2: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                        <input placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                    </div>
                                    <input placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                                    <div className="flex gap-2 justify-end pt-2">
                                        <button onClick={() => setAddingAddress(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-bold">Cancel</button>
                                        <button onClick={handleAddAddress} className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300">Save Address</button>
                                    </div>
                                </div>
                            ) : addresses.length === 0 ? (
                                <p className="text-gray-400 text-sm">No delivery address saved. You must add one before paying.</p>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {addresses.map(addr => (
                                        <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)} className={`cursor-pointer p-4 rounded-xl border transition-colors flex items-start gap-3 ${selectedAddressId === addr.id ? 'bg-yellow-400/10 border-yellow-400/30' : 'bg-black/30 border-white/5 hover:border-white/20'}`}>
                                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center ${selectedAddressId === addr.id ? 'border-yellow-400' : 'border-gray-500'}`}>
                                                {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-yellow-400" />}
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-bold text-white mb-0.5">{addr.fullName} <span className="text-gray-500 font-normal ml-2">{addr.phone}</span></p>
                                                <p className="text-gray-400 text-xs leading-relaxed">{addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} – {addr.pincode}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Wallet Balance */}
                        <div className={`border rounded-2xl p-5 mb-6 flex items-center justify-between ${canAfford ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <div className="flex items-center gap-3">
                                <Wallet className={`w-6 h-6 ${canAfford ? 'text-green-400' : 'text-red-400'}`} />
                                <div>
                                    <p className="text-white font-bold">Bidora Wallet</p>
                                    <p className={`text-sm ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                                        Available: ₹{walletBal.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {canAfford ? (
                                <span className="text-green-400 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Sufficient</span>
                            ) : (
                                <Link href="/dashboard?tab=wallet"
                                    className="text-xs font-bold px-3 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors">
                                    Top Up
                                </Link>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
                            </motion.div>
                        )}

                        {/* Confirm Checkbox */}
                        {step === 'confirm' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-4 mb-5 text-sm text-gray-400">
                                <p className="font-semibold text-yellow-400 mb-1 flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Escrow Payment Confirmation
                                </p>
                                Your funds (₹{total.toLocaleString()}) will be held in Bidora Escrow until you confirm delivery. Funds release to the seller automatically after 14 days if no dispute is raised.
                            </motion.div>
                        )}

                        {/* CTA */}
                        {step === 'review' ? (
                            <button
                                onClick={() => setStep('confirm')}
                                disabled={!canAfford}
                                className="w-full py-5 bg-yellow-400 text-black font-black text-lg rounded-xl hover:bg-yellow-300 hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(250,204,21,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
                            >
                                <Zap className="w-5 h-5" />
                                Review & Confirm — ₹{total.toLocaleString()}
                            </button>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={() => setStep('review')}
                                    className="px-6 py-4 bg-white/5 border border-white/10 text-gray-400 rounded-xl font-semibold hover:text-white transition-colors">
                                    Back
                                </button>
                                <button onClick={handlePay} disabled={paying || !canAfford}
                                    className="flex-1 py-4 bg-yellow-400 text-black font-black text-lg rounded-xl hover:bg-yellow-300 transition-all shadow-[0_0_30px_rgba(250,204,21,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                                    {paying ? (
                                        <><span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> Processing…</>
                                    ) : (
                                        <><Lock className="w-5 h-5" /> Pay ₹{total.toLocaleString()} via Escrow</>
                                    )}
                                </button>
                            </div>
                        )}

                        <p className="text-center text-xs text-gray-600 mt-4">
                            🔒 Secured by Bidora Escrow · Funds only released after you confirm delivery
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
