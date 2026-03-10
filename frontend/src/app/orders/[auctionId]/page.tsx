'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Package, Truck, CheckCircle2, Clock, MapPin, Shield,
    ArrowLeft, Star, AlertTriangle, Phone, ExternalLink,
    Upload, X, Loader2, Plus, Wallet
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';
import RatingSection from '@/components/RatingSection';
import Image from 'next/image';
// @ts-ignore
import { load } from '@cashfreepayments/cashfree-js';

let cashfree: any = null;
const initCashfree = async () => {
    if (!cashfree) {
        cashfree = await load({ mode: process.env.NEXT_PUBLIC_CASH_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox' });
    }
    return cashfree;
};

interface OrderDetail {
    id: string; title: string; imageUrls: string[];
    currentHighestBid: number; shippingCost: number;
    status: string; endTime: string;
    seller: { id: string; fullName: string; email: string; trustScore: number };
    buyer?: { id: string; fullName: string };
    shippingDetail: {
        status: string; trackingNumber: string | null; courier: string | null;
        estimatedDelivery: string | null; shippedAt: string | null; deliveredAt: string | null;
        labelUrl: string | null; trackingUrl: string | null;
        buyerAddress?: { fullName: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string };
    } | null;
    escrowPayment?: { status: string; amount: number };
    provenanceHash?: string;
    blockchainTxId?: string;
}

const STEPS = [
    { key: 'PAYMENT_PENDING', label: 'Awaiting Payment', icon: Clock, desc: 'Waiting for buyer to complete payment.' },
    { key: 'PAID', label: 'Payment Received', icon: CheckCircle2, desc: 'Escrow funded. Seller preparing shipment.' },
    { key: 'SHIPPED', label: 'Item Shipped', icon: Truck, desc: 'Package in transit to your address.' },
    { key: 'DELIVERED', label: 'Delivered', icon: Package, desc: 'Package delivered. Confirm to release funds.' },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2, desc: 'Transaction complete. Escrow released.' },
];

const STATUS_ORDER = ['PAYMENT_PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'];

function getStepIndex(status: string) {
    const idx = STATUS_ORDER.indexOf(status);
    return idx === -1 ? 0 : idx;
}

export default function OrderPage() {
    const { auctionId } = useParams() as { auctionId: string };
    const router = useRouter();
    const { user } = useAuth();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [disputing, setDisputing] = useState(false);
    const [reason, setReason] = useState('');
    const [showDispute, setShowDispute] = useState(false);
    const [generatingLabel, setGeneratingLabel] = useState(false);
    const [markingShipped, setMarkingShipped] = useState(false);
    const [markingDelivered, setMarkingDelivered] = useState(false);
    const [manualTracking, setManualTracking] = useState('');
    const [manualCourier, setManualCourier] = useState('');
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // New: Address & Wallet States
    const [wallet, setWallet] = useState<{ walletBalance: number; pendingFunds: number; availableBalance: number } | null>(null);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [paying, setPaying] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ fullName: '', line1: '', city: '', state: '', pincode: '', phone: '' });

    useEffect(() => {
        if (!user) { router.push('/auth'); return; }
        
        const loadInitialData = async () => {
             try {
                const res = await api.get(`/auctions/${auctionId}`);
                const auction = res.data.auction;
                setOrder(auction);

                // If auction is in PAYMENT_PENDING and user is buyer, fetch addresses & wallet
                if (auction.status === 'PAYMENT_PENDING' && user.id === auction.buyer?.id) {
                    const [addrRes, walletRes] = await Promise.all([
                        api.get('/shipping/address'),
                        api.get('/wallet')
                    ]);
                    setAddresses(addrRes.data.addresses || []);
                    setWallet(walletRes.data);
                    
                    // Auto-select default address if any
                    const def = addrRes.data.addresses?.find((a: any) => a.isDefault);
                    if (def) setSelectedAddressId(def.id);
                }
             } catch (err) {
                 setMessage({ type: 'error', text: 'Order not found or access denied.' });
             } finally {
                 setLoading(false);
             }
        };

        loadInitialData();
    }, [auctionId, user, router]);

    const confirmDelivery = async () => {
        setConfirming(true);
        try {
            await api.post(`/shipping/${auctionId}/confirm`);
            setOrder(prev => prev ? { ...prev, status: 'COMPLETED', shippingDetail: prev.shippingDetail ? { ...prev.shippingDetail, status: 'DELIVERED' } : prev.shippingDetail } : prev);
            setMessage({ type: 'success', text: 'Delivery confirmed! Escrow funds have been released to the seller.' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to confirm delivery.' });
        } finally { setConfirming(false); }
    };

    const openDispute = async () => {
        if (!reason.trim()) return setMessage({ type: 'error', text: 'Please describe your issue.' });
        setDisputing(true);
        try {
            await api.post('/disputes', { auctionId, reason, evidenceUrls });
            setMessage({ type: 'success', text: 'Dispute opened. Our team will review within 24–48 hours.' });
            setShowDispute(false);
            setReason('');
            setEvidenceUrls([]);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to open dispute.' });
        } finally { setDisputing(false); }
    };

    const generateLabel = async () => {
        setGeneratingLabel(true);
        try {
            const res = await api.post(`/shipping/${auctionId}/auto-label`);
            setOrder(prev => prev ? {
                ...prev,
                status: 'SHIPPED',
                shippingDetail: res.data.shippingDetail
            } : prev);
            setMessage({ type: 'success', text: 'Shipping label generated! You can now download and print it.' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to generate shipping label.' });
        } finally { setGeneratingLabel(false); }
    };

    const markAsShippedManually = async () => {
        if (!manualTracking || !manualCourier) return setMessage({ type: 'error', text: 'Please enter courier and tracking number.' });
        setMarkingShipped(true);
        try {
            const res = await api.post(`/shipping/${auctionId}/ship`, { trackingNumber: manualTracking, courier: manualCourier });
            setOrder(prev => prev ? {
                ...prev,
                status: 'SHIPPED',
                shippingDetail: res.data.shippingDetail
            } : prev);
            setMessage({ type: 'success', text: 'Order marked as shipped!' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to mark as shipped.' });
        } finally { setMarkingShipped(false); }
    };

    const markAsDeliveredManually = async () => {
        setMarkingDelivered(true);
        try {
            await api.post(`/shipping/${auctionId}/delivered`);
            setOrder(prev => prev ? { ...prev, status: 'DELIVERED', shippingDetail: prev.shippingDetail ? { ...prev.shippingDetail, status: 'DELIVERED' } : prev.shippingDetail } : prev);
            setMessage({ type: 'success', text: 'Order marked as delivered. Buyer can now confirm receipt.' });
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to mark as delivered.' });
        } finally { setMarkingDelivered(false); }
    };

    const handleAddAddress = async () => {
        if (!newAddress.fullName || !newAddress.line1 || !newAddress.city || !newAddress.pincode) {
            return setMessage({ type: 'error', text: 'Please fill all required address fields.' });
        }
        try {
            const res = await api.post('/shipping/address', newAddress);
            setAddresses(prev => [...prev, res.data.address]);
            setSelectedAddressId(res.data.address.id);
            setShowAddressForm(false);
            setMessage({ type: 'success', text: 'Address added successfully!' });
        } catch (e: any) {
            setMessage({ type: 'error', text: 'Failed to add address.' });
        }
    };

    const handlePayment = async () => {
        if (!selectedAddressId) return setMessage({ type: 'error', text: 'Please select a shipping address.' });
        setPaying(true);
        try {
            const totalDue = Number(order!.currentHighestBid) + Number(order!.shippingCost);
            const available = wallet?.availableBalance || 0;

            if (available < totalDue) {
                const diff = totalDue - available;
                // Deposit the difference
                const res = await api.post('/payments/create-order', { amount: Math.ceil(diff) });
                const cf = await initCashfree();
                
                cf.checkout({
                    paymentSessionId: res.data.payment_session_id,
                    redirectTarget: "_modal",
                }).then(async (result: any) => {
                    if (result.paymentDetails) {
                        try {
                            await api.post('/payments/verify', { order_id: res.data.order_id });
                            // Now try to pay for auction
                            const payRes = await api.post('/wallet/pay-auction', { auctionId, addressId: selectedAddressId });
                            setOrder(prev => prev ? { ...prev, status: payRes.data.status } : prev);
                            setMessage({ type: 'success', text: 'Deposit & Payment successful! Awaiting shipment.' });
                        } catch (err) {
                            setMessage({ type: 'error', text: 'Payment verification failed. Please refresh.' });
                        }
                    } else {
                        setMessage({ type: 'error', text: 'Deposit failed or cancelled.' });
                    }
                    setPaying(false);
                });
            } else {
                const payRes = await api.post('/wallet/pay-auction', { auctionId, addressId: selectedAddressId });
                setOrder(prev => prev ? { ...prev, status: payRes.data.status } : prev);
                setMessage({ type: 'success', text: 'Payment successful! Awaiting shipment.' });
                setPaying(false);
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Payment failed.' });
            setPaying(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!order) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <p className="text-4xl mb-4">📦</p>
                <p className="text-gray-400">Order not found.</p>
                <Link href="/dashboard" className="mt-4 inline-block text-yellow-400 hover:underline">Back to Dashboard</Link>
            </div>
        </div>
    );

    const stepIdx = getStepIndex(order.status);
    const isBuyer = user?.id === order.buyer?.id;
    const isSeller = user?.id === order.seller.id;
    const canConfirm = isBuyer && order.status === 'DELIVERED';
    const canGenerateLabel = isSeller && order.status === 'PAID';
    const canPay = isBuyer && order.status === 'PAYMENT_PENDING';

    return (
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">

            <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Dashboard
            </Link>

            {/* Message Toast */}
            {message && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 flex items-start gap-3 px-5 py-4 rounded-xl text-sm font-medium border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    {message.text}
                </motion.div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Order Tracking</p>
                    <h1 className="text-3xl font-black tracking-tighter line-clamp-2">{order.title}</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Seller: <span className="text-white">{order.seller.fullName}</span>
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <p className="text-gray-500 text-xs">Order Total</p>
                    <p className="text-2xl font-black text-yellow-400">
                        ₹{(Number(order.currentHighestBid) + Number(order.shippingCost)).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Progress Tracker */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6">
                <h2 className="font-bold text-lg mb-8">Shipment Progress</h2>
                <div className="relative">
                    {/* Progress Bar */}
                    <div className="absolute top-5 left-5 right-5 h-0.5 bg-white/10">
                        <motion.div className="h-full bg-yellow-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${(stepIdx / (STEPS.length - 1)) * 100}%` }}
                            transition={{ duration: 1, ease: 'easeInOut' }} />
                    </div>

                    <div className="flex justify-between relative z-10">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            const done = i <= stepIdx;
                            const active = i === stepIdx;
                            return (
                                <div key={s.key} className="flex flex-col items-center text-center max-w-[80px]">
                                    <motion.div
                                        initial={{ scale: 0.8 }} animate={{ scale: active ? 1.15 : 1 }}
                                        transition={{ duration: 0.3 }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all mb-3 ${done ? 'bg-yellow-400 border-yellow-400  text-black' : 'bg-black border-white/20 text-gray-600'} ${active ? 'shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}`}>
                                        <Icon className="w-4 h-4" />
                                    </motion.div>
                                    <p className={`text-xs font-bold leading-tight ${done ? 'text-white' : 'text-gray-600'}`}>{s.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Current Status Description */}
                <div className="mt-8 bg-black/30 rounded-xl p-4 border border-white/5">
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">Current Status</p>
                    <p className="text-white font-semibold">{STEPS[stepIdx]?.label}</p>
                    <p className="text-gray-400 text-sm mt-1">{STEPS[stepIdx]?.desc}</p>
                </div>
            </div>

            {/* Two Column: Tracking + Shipping Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">

                {/* Tracking Details */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-yellow-400" /> Tracking Info</h3>
                    {['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(order.status) && order.shippingDetail ? (
                        <div className="space-y-3">
                            {[
                                { label: 'Courier', value: order.shippingDetail.courier || 'TBD' },
                                { label: 'Tracking Number', value: order.shippingDetail.trackingNumber || 'TBD' },
                                { label: 'Est. Delivery', value: order.shippingDetail.estimatedDelivery ? new Date(order.shippingDetail.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD' },
                                { label: 'Shipped On', value: order.shippingDetail.shippedAt ? new Date(order.shippingDetail.shippedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Not yet shipped' },
                                { label: 'Delivered On', value: order.shippingDetail.deliveredAt ? new Date(order.shippingDetail.deliveredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—' },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between text-sm">
                                    <span className="text-gray-500">{row.label}</span>
                                    <span className={`font-semibold ${row.value === 'TBD' || row.value === '—' || row.value === 'Not yet shipped' ? 'text-gray-500' : 'text-white'}`}>{row.value}</span>
                                </div>
                            ))}

                            {order.shippingDetail.trackingNumber && order.shippingDetail.courier && (
                                <a href={order.shippingDetail.trackingUrl || `https://www.google.com/search?q=${order.shippingDetail.courier}+track+${order.shippingDetail.trackingNumber}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-yellow-400 text-sm hover:underline mt-2">
                                    Track on courier site <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                            {order.shippingDetail.labelUrl && isSeller && (
                                <a href={order.shippingDetail.labelUrl}
                                    target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-indigo-400 font-bold text-sm hover:underline mt-2 ml-4">
                                    <Package className="w-4 h-4" /> Download Shipping Label PDF
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-500 text-sm">Shipping details will appear once the seller ships your item.</p>

                            {isSeller && order.status === 'PAYMENT_PENDING' && (
                                <p className="text-yellow-400/80 text-xs italic">Awaiting buyer payment before shipping labels can be generated.</p>
                            )}

                            {isSeller && order.status === 'PAID' && (
                                <div className="space-y-4 pt-2">
                                    <div className="text-center text-xs text-gray-500 font-bold uppercase tracking-widest my-2 line-through"><span className="bg-black px-2">Shipment Options</span></div>
                                    <button onClick={generateLabel} disabled={generatingLabel}
                                        className="w-full py-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl hover:bg-indigo-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                        {generatingLabel ? <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Package className="w-4 h-4" />}
                                        {generatingLabel ? 'Purchasing Label…' : 'Auto-Generate Shipping Label'}
                                    </button>

                                    <div className="text-center text-xs text-gray-600 font-bold uppercase tracking-widest my-2">OR ENTER MANUALLY</div>
                                    <div className="space-y-2">
                                        <input type="text" placeholder="Courier Name (e.g. FedEx, BlueDart)" value={manualCourier} onChange={e => setManualCourier(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50" />
                                        <input type="text" placeholder="Tracking Number" value={manualTracking} onChange={e => setManualTracking(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/50" />
                                        <button onClick={markAsShippedManually} disabled={markingShipped}
                                            className="w-full py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-sm">
                                            {markingShipped ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Mark as Shipped
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isSeller && order.status === 'SHIPPED' && (
                                <div className="pt-4 border-t border-white/5">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">Seller Actions</p>
                                    <button onClick={markAsDeliveredManually} disabled={markingDelivered}
                                        className="w-full py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded-xl hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2 text-sm">
                                        {markingDelivered ? <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /> : <Package className="w-4 h-4" />}
                                        Mark as Delivered
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Delivery Address */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><MapPin className="w-5 h-5 text-yellow-400" /> Delivery Address</h3>
                    {order.shippingDetail?.buyerAddress ? (
                        <div className="text-sm text-gray-300 leading-relaxed space-y-1">
                            <p className="font-bold text-white mb-1">{order.shippingDetail.buyerAddress.fullName}</p>
                            <p>{order.shippingDetail.buyerAddress.line1}</p>
                            {order.shippingDetail.buyerAddress.line2 && <p>{order.shippingDetail.buyerAddress.line2}</p>}
                            <p>{order.shippingDetail.buyerAddress.city}, {order.shippingDetail.buyerAddress.state} – {order.shippingDetail.buyerAddress.pincode}</p>
                            <p>{order.shippingDetail.buyerAddress.country}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">Address not set. Please add your shipping address in your profile.</p>
                    )}

                    {/* Escrow Badge */}
                    <div className="pt-4 border-t border-white/5">
                        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border ${order.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400'}`}>
                            <Shield className="w-4 h-4" />
                            {order.status === 'COMPLETED' ? 'Escrow Released to Seller' : 'Funds Held in Escrow — Protected'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center font-black text-yellow-400">
                        {order.seller.fullName?.charAt(0) || '?'}
                    </div>
                    <div>
                        <p className="font-bold text-white">{order.seller.fullName}</p>
                        <p className="text-gray-500 text-xs">{order.seller.email}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-yellow-400 font-semibold">{Number(order.seller.trustScore).toFixed(1)}</span>
                            <span className="text-gray-600 text-xs">trust score</span>
                        </div>
                    </div>
                </div>
                <Link href={`/profile/${order.seller.id}`}
                    className="text-xs font-bold px-4 py-2 border border-white/10 bg-white/5 text-gray-400 rounded-xl hover:text-white hover:bg-white/10 transition-colors">
                    View Profile
                </Link>
            </div>

            {/* Actions */}
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                <div className="space-y-4">
                    {/* Payment Section */}
                    {canPay && order && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
                            <div className="bg-yellow-400/5 border-2 border-yellow-400/20 rounded-[2rem] p-6 sm:p-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl -z-10" />
                                
                                <h3 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center gap-3">
                                    <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-400" /> Complete Your Purchase
                                </h3>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Left: Address Selection */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Shipping Address</p>
                                        
                                        {addresses.length > 0 && !showAddressForm ? (
                                            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {addresses.map(addr => (
                                                    <button key={addr.id} onClick={() => setSelectedAddressId(addr.id)}
                                                        className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedAddressId === addr.id ? 'bg-yellow-400/10 border-yellow-400 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-bold text-sm">{addr.fullName}</p>
                                                            {selectedAddressId === addr.id && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                                                        </div>
                                                        <p className="text-[11px] mt-1 line-clamp-1">{addr.line1}, {addr.city}</p>
                                                    </button>
                                                ))}
                                                <button onClick={() => setShowAddressForm(true)} className="w-full py-3 text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                                                    <Plus className="w-3 h-3" /> Add New Address
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5">
                                                <input type="text" placeholder="Full Name" value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50" />
                                                <input type="text" placeholder="Address line 1" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="text" placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50" />
                                                    <input type="text" placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50" />
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <button onClick={handleAddAddress} className="flex-1 py-2.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 font-bold rounded-xl text-xs hover:bg-yellow-400/20 transition-colors">Save Address</button>
                                                    {addresses.length > 0 && <button onClick={() => setShowAddressForm(false)} className="px-4 py-2.5 text-gray-500 font-bold text-xs hover:text-white transition-colors">Cancel</button>}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Payment Details */}
                                    <div className="bg-black/40 rounded-3xl p-6 border border-white/5 space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Winning Bid</span>
                                                <span className="font-bold text-white">₹{Number(order.currentHighestBid).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500">Shipping</span>
                                                <span className="font-bold text-white">₹{Number(order.shippingCost).toLocaleString()}</span>
                                            </div>
                                            <div className="pt-2 border-t border-white/10 flex justify-between">
                                                <span className="font-black text-white text-sm">Total Due</span>
                                                <span className="font-black text-yellow-400 text-lg">₹{(Number(order.currentHighestBid) + Number(order.shippingCost)).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-white/10">
                                            <div className="flex justify-between items-center mb-4">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Your Wallet</p>
                                                    <p className={`font-black text-sm ${Number(wallet?.availableBalance || 0) < (Number(order.currentHighestBid) + Number(order.shippingCost)) ? 'text-red-400' : 'text-green-400'}`}>
                                                        ₹{Number(wallet?.availableBalance || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                                {Number(wallet?.availableBalance || 0) < (Number(order.currentHighestBid) + Number(order.shippingCost)) && (
                                                    <div className="text-[8px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20">
                                                        Low Balance
                                                    </div>
                                                )}
                                            </div>

                                            <button onClick={handlePayment} disabled={paying || (!selectedAddressId)}
                                                className="w-full py-4 bg-yellow-400 text-black font-black uppercase tracking-tighter text-base rounded-2xl hover:bg-yellow-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(250,204,21,0.2)]">
                                                {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                                                {Number(wallet?.availableBalance || 0) < (Number(order.currentHighestBid) + Number(order.shippingCost)) 
                                                    ? 'Top up & Pay' 
                                                    : 'Complete Purchase'}
                                            </button>
                                            <p className="text-[8px] text-gray-600 text-center mt-3 font-bold uppercase tracking-widest leading-relaxed">
                                                Secure Escrow Payment<br/>Funds held until you confirm delivery
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {/* Confirm Delivery Button */}
                    {canConfirm && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                                <p className="font-bold text-white mb-1 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-green-400" /> Received your item?
                                </p>
                                <p className="text-gray-400 text-sm mb-4">
                                    Confirming delivery releases the escrow funds to the seller. Only confirm if you've actually received and inspected your item.
                                </p>
                                <button onClick={confirmDelivery} disabled={confirming}
                                    className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    {confirming ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    {confirming ? 'Confirming…' : 'Confirm Delivery & Release Payment'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Raise Dispute */}
                    {isBuyer && ['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status) && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                            <button onClick={() => setShowDispute(!showDispute)}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-bold transition-colors">
                                <AlertTriangle className="w-4 h-4" />
                                {showDispute ? 'Cancel Dispute' : 'Raise a Dispute — Item not received / damaged?'}
                            </button>

                            {showDispute && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
                                    <textarea value={reason} onChange={e => setReason(e.target.value)}
                                        placeholder="Describe the issue clearly (e.g. item not received after 14 days, item damaged, not as described)…"
                                        rows={4} maxLength={1000}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 outline-none focus:border-red-500/50 resize-none" />

                                    {/* Evidence Upload */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Visual Evidence (Required for damaged items)</p>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                            {evidenceUrls.map((url, i) => (
                                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                                    <Image src={url} alt="" fill className="object-cover" />
                                                    <button onClick={() => setEvidenceUrls(urls => urls.filter((_, idx) => idx !== i))}
                                                        className="absolute top-1 right-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all">
                                                        <X className="w-3 h-3 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                            {evidenceUrls.length < 5 && (
                                                <label className="aspect-square rounded-lg bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 hover:border-red-500/30 transition-all">
                                                    {uploading ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" /> : <Plus className="w-4 h-4 text-gray-500" />}
                                                    <input type="file" className="hidden" accept="image/*" multiple onChange={async e => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (files.length === 0) return;
                                                        setUploading(true);
                                                        try {
                                                            const fd = new FormData();
                                                            files.forEach(f => fd.append('images', f));
                                                            const res = await api.post('/upload', fd);
                                                            setEvidenceUrls(prev => [...prev, ...res.data.urls].slice(0, 5));
                                                        } catch (err) {
                                                            setMessage({ type: 'error', text: 'Image upload failed.' });
                                                        } finally { setUploading(false); }
                                                    }} />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <button onClick={openDispute} disabled={disputing || !reason.trim() || uploading}
                                        className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50 text-sm flex items-center gap-2">
                                        {disputing ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                                        Submit Dispute
                                    </button>
                                    <p className="text-gray-600 text-xs">Funds remain in escrow during dispute resolution. Our team responds within 24–48 hours.</p>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Rate Seller (after delivery) */}
                    {isBuyer && (order.status === 'DELIVERED' || order.status === 'COMPLETED') && (
                        <Link href={`/profile/${order.seller.id}`}
                            className="w-full flex items-center justify-center gap-2 py-3.5 border border-yellow-400/20 bg-yellow-400/5 text-yellow-400 font-bold rounded-xl hover:bg-yellow-400/10 transition-colors">
                            <Star className="w-5 h-5" /> Rate Your Seller Experience
                        </Link>
                    )}
                </div>
            )}

            {order.status === 'COMPLETED' && (
                <div className="space-y-6">
                    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 text-center">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <h3 className="font-black text-white text-xl mb-2">Order Complete!</h3>
                        <p className="text-gray-400 text-sm mb-5">Transaction successfully closed. Escrow funds have been released to the seller.</p>

                        {/* Reciprocal Rating Section */}
                        <div className="mt-8 pt-8 border-t border-white/5 text-left">
                            <RatingSection
                                sellerId={isSeller ? (order.buyer?.id || '') : order.seller.id}
                                sellerName={isSeller ? (order.buyer?.fullName || 'Buyer') : order.seller.fullName}
                                auctionId={auctionId}
                                showForm={true}
                                targetType={isSeller ? 'BUYER' : 'SELLER'}
                                canRateUserId={isSeller ? (order.buyer?.id || '') : order.seller.id}
                                canRateUserName={isSeller ? (order.buyer?.fullName || 'Buyer') : order.seller.fullName}
                            />
                        </div>
                    </div>

                    {/* Web3 Provenance Hash Card */}
                    {order.provenanceHash && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-950 border-2 border-yellow-400/30 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-[0_20px_50px_rgba(250,204,21,0.1)]"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 blur-[100px] rounded-full pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                                        <Shield className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em]">Ledger Authenticated</p>
                                        <h3 className="text-white font-black text-xl tracking-tight">Provenance Certificate</h3>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                        <span className="text-blue-400 text-[9px] font-black uppercase tracking-widest">Web3 Verified</span>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                    This auction result has been cryptographically hashed and anchored to the global ledger. This ensures permanent, immutable proof of ownership transfer from <span className="text-white font-bold">{order.seller.fullName}</span> to <span className="text-white font-bold">{order.buyer?.fullName}</span>.
                                </p>

                                <div className="space-y-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Cryptographic Hash (SHA-256)</p>
                                        <div className="flex items-center justify-between">
                                            <code className="text-xs text-yellow-500/80 font-mono break-all line-clamp-1">{order.provenanceHash}</code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(order.provenanceHash!);
                                                    setMessage({ type: 'success', text: 'Hash copied to clipboard!' });
                                                }}
                                                className="text-gray-500 hover:text-white transition-colors ml-4"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Blockchain Transaction ID</p>
                                        <div className="flex items-center justify-between">
                                            <code className="text-xs text-blue-400/80 font-mono break-all line-clamp-1">{order.blockchainTxId}</code>
                                            <a
                                                href={`https://polygonscan.com/tx/${order.blockchainTxId}`} // Simulated explorer link
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-500 hover:text-white transition-colors ml-4"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex items-center justify-center border-t border-white/10 pt-6">
                                    <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Trustless Verification Enabled</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
}
