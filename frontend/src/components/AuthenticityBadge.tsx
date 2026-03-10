'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, ShieldAlert, Sparkles, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthenticityBadge({ level = 'VERIFIED' }: { level?: 'VERIFIED' | 'PREMIUM' | 'AUTHENTICATED' }) {
    return (
        <div className="flex flex-col gap-3">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden group p-4 rounded-3xl bg-gradient-to-br from-blue-500/10 via-zinc-900/60 to-indigo-500/10 border border-blue-500/30 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.3)] backdrop-blur-3xl"
            >
                {/* Micro-shimmer effect */}
                <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 w-32 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent skew-x-12"
                />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/40 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <ShieldCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Authenticity Shield</span>
                            <div className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest animate-pulse">
                                Live Protected
                            </div>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1 flex items-center gap-2">
                            Verified Product Listing <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        </h4>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wide opacity-70">
                            Digital Fingerprint: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                        </p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <Fingerprint className="w-3 h-3 text-blue-500" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Expert Authenticated</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Premium Origin</span>
                    </div>
                </div>
            </motion.div>

            {/* Micro-Trust Strip */}
            <div className="px-4 flex items-center justify-between text-[8px] font-black uppercase tracking-[0.15em] text-gray-600">
                <span className="flex items-center gap-1"><ShieldAlert className="w-2 h-2" /> Buyer Protection Included</span>
                <span className="flex items-center gap-1">•</span>
                <span>Bidora Secure Escrow</span>
            </div>
        </div>
    );
}
