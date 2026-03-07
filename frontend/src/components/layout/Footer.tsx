'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone,
    ArrowRight, Trophy, ShieldCheck, Zap, Globe
} from 'lucide-react';

export default function Footer() {
    return (
        <footer className="relative bg-zinc-950 border-t border-white/5 pt-20 pb-12 overflow-hidden">
            {/* Ambient background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[150px] -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[150px] -z-10 rounded-full" />

            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-16 text-center sm:text-left">

                    {/* Brand Section */}
                    <div className="space-y-6 flex flex-col items-center sm:items-start text-center sm:text-left">
                        <Link href="/" className="inline-block">
                            <h2 className="text-3xl font-black tracking-tighter text-white">
                                BIDORA<span className="text-yellow-400">.</span>
                            </h2>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto sm:ml-0">
                            India&apos;s home for verified sneaker auctions. Hunt, bid, and win — with zero risk and zero lag.
                        </p>
                        <div className="flex items-center space-x-4">
                            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                                <Link key={i} href="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all">
                                    <Icon size={18} />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6 pt-8 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <h3 className="text-white font-black uppercase text-xs tracking-[0.2em]">Marketplace</h3>
                        <ul className="space-y-4">
                            {[
                                { name: 'Live Auctions', href: '/#live-auctions' },
                                { name: 'Verified Luxury', href: '/search?category=luxury' },
                                { name: 'Rare Collectibles', href: '/search?category=collectibles' },
                                { name: 'Newly Listed', href: '/search?sort=newest' },
                                { name: 'Ending Soon', href: '/search?sort=ending' }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors flex items-center justify-center sm:justify-start group">
                                        <ArrowRight size={12} className="mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-yellow-400 hidden sm:block" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company & Support */}
                    <div className="space-y-6 pt-8 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <h3 className="text-white font-black uppercase text-xs tracking-[0.2em]">Bidora</h3>
                        <ul className="space-y-4">
                            {[
                                { name: 'About CEO (Pruthviraj)', href: '/about' },
                                { name: 'Terms of Service', href: '/legal/terms' },
                                { name: 'Privacy Policy', href: '/legal/privacy' },
                                { name: 'Bidding Guide', href: '/support/bidding-guide' },
                                { name: 'Seller Verification', href: '/support/seller-verification' }
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors flex items-center justify-center sm:justify-start group">
                                        <ArrowRight size={12} className="mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-yellow-400 hidden sm:block" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Community */}
                    <div className="space-y-6 pt-8 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <h3 className="text-white font-black uppercase text-xs tracking-[0.2em]">Community</h3>
                        <ul className="space-y-4">
                            {[
                                { name: 'Bidora Discord', href: '#' },
                                { name: 'Friday Drops Waitlist', href: '#' },
                                { name: 'Seller Stories', href: '#' },
                                { name: 'Hall of Fame', href: '#' },
                                { name: 'Bidora OG Program', href: '#' },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link href={link.href} className="text-gray-400 text-sm hover:text-white transition-colors flex items-center justify-center sm:justify-start group">
                                        <ArrowRight size={12} className="mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-yellow-400 hidden sm:block" />
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="space-y-6 pt-8 sm:pt-0 border-t sm:border-t-0 border-white/5 flex flex-col items-center sm:items-start text-center sm:text-left transition-all">
                        <h3 className="text-white font-black uppercase text-xs tracking-[0.2em]">Our Newsletter</h3>
                        <p className="text-gray-400 text-sm max-w-xs">Join 20k+ collectors getting weekly deal updates.</p>
                        <div className="relative group w-full max-w-sm sm:max-w-none">
                            <input
                                type="email"
                                placeholder="name@email.com"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-yellow-400/50 focus:ring-4 focus:ring-yellow-400/10 transition-all placeholder:text-gray-600"
                            />
                            <button className="absolute right-2 top-2 bottom-2 bg-yellow-400 hover:bg-yellow-300 transition-all px-4 rounded-xl text-zinc-950 font-bold text-xs uppercase tracking-wider">
                                Join
                            </button>
                        </div>
                        <div className="pt-4 flex items-center space-x-2 text-gray-500 text-xs">
                            <Globe size={14} className="text-yellow-400/60" />
                            <span>Proudly built in India 🇮🇳</span>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* Trust Indicators */}
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

                    <div className="text-gray-500 text-xs font-medium flex items-center gap-3">
                        <span>© {new Date().getFullYear()} BIDORA INC. ALL RIGHTS RESERVED.</span>
                        <span className="text-gray-600">·</span>
                        <span>Made with 🔥 in India</span>
                    </div>

                </div>
            </div>
        </footer>
    );
}
