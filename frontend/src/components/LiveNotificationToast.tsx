'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Trophy, AlertCircle, CheckCircle2, Package, CreditCard } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import Link from 'next/link';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'https://bidora-api-production.up.railway.app';

interface ToastNotif {
    id: string;
    type: string;
    title: string;
    body: string;
    referenceId?: string;
}

const ICONS: Record<string, React.ReactNode> = {
    AUCTION_WON: <Trophy className="w-5 h-5 text-yellow-400" />,
    OUTBID: <AlertCircle className="w-5 h-5 text-red-400" />,
    BID_PLACED: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    PAYMENT_REQUIRED: <CreditCard className="w-5 h-5 text-orange-400" />,
    ITEM_SHIPPED: <Package className="w-5 h-5 text-blue-400" />,
    DEFAULT: <Bell className="w-5 h-5 text-gray-400" />
};

const COLORS: Record<string, string> = {
    AUCTION_WON: 'border-yellow-400/40 bg-yellow-400/10',
    OUTBID: 'border-red-500/40 bg-red-500/10',
    BID_PLACED: 'border-green-500/40 bg-green-500/10',
    PAYMENT_REQUIRED: 'border-orange-400/40 bg-orange-400/10',
    ITEM_SHIPPED: 'border-blue-400/40 bg-blue-400/10',
    DEFAULT: 'border-white/20 bg-white/5'
};

export default function LiveNotificationToast() {
    const { user } = useAuth();
    const [toasts, setToasts] = useState<ToastNotif[]>([]);

    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const initSocket = async () => {
            const { io } = await import('socket.io-client');
            const socket = io(WS_URL, {
                auth: { token },
                reconnection: true,
                transports: ['websocket', 'polling']
            });

            socket.on('connect', () => {
                console.log('[LiveNotif] WS connected for global notifications');
            });

            socket.on('notification', (data: ToastNotif) => {
                const notif: ToastNotif = { ...data, id: data.id || String(Date.now()) };
                setToasts(prev => [notif, ...prev].slice(0, 5));
                setTimeout(() => setToasts(prev => prev.filter(t => t.id !== notif.id)), 6000);
            });

            socket.on('outbid', (data: any) => {
                const notif: ToastNotif = {
                    id: String(Date.now()),
                    type: 'OUTBID',
                    title: "You've Been Outbid! 🔔",
                    body: `New highest bid: ₹${Number(data.newHighestBid).toLocaleString()}`,
                    referenceId: data.auctionId
                };
                setToasts(prev => [notif, ...prev].slice(0, 5));
                setTimeout(() => setToasts(prev => prev.filter(t => t.id !== notif.id)), 6000);
            });

            return socket;
        };

        let activeSocket: any = null;
        initSocket().then(s => activeSocket = s);

        return () => {
            if (activeSocket) activeSocket.disconnect();
        };
    }, [user?.id]);

    const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <div className="fixed bottom-5 right-5 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${COLORS[toast.type] || COLORS.DEFAULT}`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {ICONS[toast.type] || ICONS.DEFAULT}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm leading-snug">{toast.title}</p>
                            <p className="text-gray-300 text-xs mt-0.5 line-clamp-2">{toast.body}</p>
                            {toast.referenceId && (
                                <Link
                                    href={`/auctions/${toast.referenceId}`}
                                    className="text-yellow-400 text-xs font-semibold mt-1.5 inline-block hover:underline"
                                >
                                    View Auction →
                                </Link>
                            )}
                        </div>
                        <button onClick={() => dismiss(toast.id)} className="flex-shrink-0 text-gray-500 hover:text-white transition-colors mt-0.5">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
