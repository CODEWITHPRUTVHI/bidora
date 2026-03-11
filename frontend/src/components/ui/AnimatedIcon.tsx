'use client';

import { motion } from 'framer-motion';
import React from 'react';

// ── Pulse ring effect (for notifications, live badges) ──────────────
export function PulseIcon({ children, color = '#facc15' }: { children: React.ReactNode; color?: string }) {
    return (
        <div className="relative flex items-center justify-center">
            <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: color, opacity: 0.3 }}
            />
            {children}
        </div>
    );
}

// ── Bounce icon (for alerts, unread counts) ──────────────────────────
export function BounceIcon({ children, active = true }: { children: React.ReactNode; active?: boolean }) {
    return (
        <motion.div
            animate={active ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
            {children}
        </motion.div>
    );
}

// ── Spin icon (for loading, search) ─────────────────────────────────
export function SpinIcon({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
            {children}
        </motion.div>
    );
}

// ── Hover-scale icon (general interactive icons) ─────────────────────
export function HoverIcon({
    children,
    className = '',
    onClick,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}) {
    return (
        <motion.div
            className={className}
            whileHover={{ scale: 1.2, rotate: 5 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}

// ── Flame icon animated (for Live section) ───────────────────────────
export function FlameAnimated({ className = 'w-8 h-8 text-yellow-400' }: { className?: string }) {
    return (
        <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
        >
            <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={className}
                xmlns="http://www.w3.org/2000/svg"
            >
                <path d="M12 2C9.5 5.5 7 7.5 7 11c0 2.76 2.24 5 5 5s5-2.24 5-5c0-3.5-2.5-5.5-5-9zm0 13c-1.66 0-3-1.34-3-3 0-1.5.75-2.5 1.5-3.5.5 1 1 1.5 1.5 2 .5-1 1.5-2 1.5-3.5 1.5 1.5 1.5 3 1.5 5 0 1.66-1.34 3-3 3z" />
            </svg>
        </motion.div>
    );
}

// ── Trophy shimmer (for winning bids, achievements) ──────────────────
export function TrophyAnimated({ className = 'w-4 h-4 text-yellow-400' }: { className?: string }) {
    return (
        <motion.div
            animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
        </motion.div>
    );
}

// ── Bell ring animation ───────────────────────────────────────────────
export function BellAnimated({ className = 'w-5 h-5', hasUnread = false }: { className?: string; hasUnread?: boolean }) {
    return (
        <motion.div
            animate={hasUnread ? { rotate: [-15, 15, -10, 10, 0] } : {}}
            transition={{ duration: 0.5, repeat: hasUnread ? Infinity : 0, repeatDelay: 3 }}
            className="inline-flex"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
        </motion.div>
    );
}

// ── Shield check with glow (verification) ────────────────────────────
export function ShieldAnimated({ className = 'w-5 h-5 text-blue-400' }: { className?: string }) {
    return (
        <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(96,165,250,0.5))' }}
            className="inline-flex"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        </motion.div>
    );
}

// ── Package (delivery) bounce ─────────────────────────────────────────
export function PackageAnimated({ className = 'w-6 h-6 text-purple-400' }: { className?: string }) {
    return (
        <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
                <path d="m16.5 9.4-9-5.19" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" x2="12" y1="22" y2="12" />
            </svg>
        </motion.div>
    );
}
