'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone,
    ArrowRight, Trophy, ShieldCheck, Zap, Globe
} from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative bg-zinc-950 border-t border-white/5 pt-16 sm:pt-20 pb-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[150px] -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[150px] -z-10 rounded-full" />

            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-y-12 gap-x-6 mb-16 text-left">
                    <div className="col-span-2 lg:col-span-1 space-y-6 flex flex-col items-center sm:items-start text-center sm:text-left mb-4 lg:mb-0">
                        <Link href="/" className="inline-block">
                            <h2 className="text-3xl font-black tracking-tighter text-white">
                                BIDORA<span className="text-yellow-400">.</span>
                            </h2>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto sm:ml-0">
                            India&apos;s home for verified sneaker auctions. Hunt, bid, and win.
                        </p>
                        <div className="flex items-center space-x-4">
                            {[
                                { icon: Facebook, label: 'Facebook', href: 'https://facebook.com/bidora' },
                                { icon: Twitter, label: 'Twitter', href: 'https://twitter.com/bidora' },
                                { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/bidora' },
                                { icon: Youtube, label: 'YouTube', href: 'https://youtube.com/bidora' }
                            ].map(({ icon: Icon, label, href }, i) => (
                                <a key={i} target="_blank" rel="noopener noreferrer" href={href} aria-label={label} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-all">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] opacity-50">Market</h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Live Drops', href: '/search' },
                                { name: 'Verified', href: '/' },
                                { name: 'Rare Hits', href: '/search?category=Rare' },
                                { name: 'Ending Soon', href: '/search?sort=ending' }
                            ].map(item => (
                                <li key={item.name}><Link href={item.href} className="text-gray-400 text-xs hover:text-white transition-colors">{item.name}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] opacity-50">Bidora</h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'How It Works', href: '/' },
                                { name: 'Sell Items', href: '/create-auction' },
                                { name: 'My Account', href: '/dashboard' },
                                { name: 'Support', href: '/inbox' }
                            ].map(item => (
                                <li key={item.name}><Link href={item.href} className="text-gray-400 text-xs hover:text-white transition-colors">{item.name}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] opacity-50">Legal</h3>
                        <ul className="space-y-3">
                            {['Terms', 'Privacy', 'Escrow Policy', 'Refunds'].map(name => (
                                <li key={name}><Link href="/" className="text-gray-400 text-xs hover:text-white transition-colors">{name}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-2 lg:col-span-1 space-y-6 flex flex-col items-center sm:items-start text-center sm:text-left pt-6 lg:pt-0 border-t lg:border-t-0 border-white/5">
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.2em] opacity-50">Newsletter</h3>
                        <div className="relative w-full">
                            <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-yellow-400/50" />
                            <button className="absolute right-1 top-1 bottom-1 bg-yellow-400 px-4 rounded-lg text-black font-black text-[10px] uppercase">Join</button>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-500 text-[10px] font-bold mt-2">
                            <Globe size={12} className="text-yellow-400/60" />
                            <span>Proudly Built In India</span>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
                        <div className="flex items-center space-x-2 text-[10px] font-black tracking-widest uppercase text-gray-500">
                            <ShieldCheck className="text-yellow-400 w-4 h-4" />
                            <span>100% Escrow Protected</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] font-black tracking-widest uppercase text-gray-500">
                            <Trophy className="text-yellow-400 w-4 h-4" />
                            <span>Verified Authentic</span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] font-black tracking-widest uppercase text-gray-500">
                            <Zap className="text-yellow-400 w-4 h-4" />
                            <span>Real-Time Bidding</span>
                        </div>
                    </div>

                    <div className="text-gray-500 text-[10px] font-medium flex items-center gap-3">
                        <span>© {new Date().getFullYear()} BIDORA INC.</span>
                        <span className="text-gray-600">·</span>
                        <span>Made with 🔥 in India</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
