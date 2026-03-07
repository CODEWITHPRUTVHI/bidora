'use client';

import { motion } from 'framer-motion';
import { Tag, TrendingUp, ShieldCheck, Zap, ArrowRight, DollarSign, Camera, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
        {children}
    </motion.div>
);

const FEATURES = [
    {
        icon: Tag,
        title: "List in 60 Seconds",
        desc: "Upload high-quality photos, set your starting price, and launch your auction. Our streamlined process makes 'listing sneakers India' faster than any other marketplace."
    },
    {
        icon: TrendingUp,
        title: "Market Value Bidding",
        desc: "Don't settle for 'low-ball' offers. Let the sneaker community in India decide the true market value through competitive live bidding. Real demand drives higher profits."
    },
    {
        icon: ShieldCheck,
        title: "Zero Payment Risk",
        desc: "Never worry about 'fake payment' screenshots or UPI scams again. Every winning bid is backed by real funds already held in Bidora's secure India-based escrow account."
    },
    {
        icon: Zap,
        title: "Rapid Payouts",
        desc: "Once your item is authenticated and delivered, funds are released to your bank account or UPI instantly. No 30-day waiting periods for your hard-earned 'sneaker reselling' profit."
    }
];

export default function SellSneakers() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-32 pb-20 selection:bg-yellow-500/30">
            {/* SEO Hidden H1 */}
            <h1 className="sr-only">Sell Sneakers Online India | List Your Rare Kicks on Bidora</h1>

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-yellow-500/[0.03] blur-[150px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
                    <FadeIn>
                        <p className="text-yellow-500 text-xs font-black uppercase tracking-[0.3em] mb-4">For the Sellers</p>
                        <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8 italic leading-[0.85]">
                            CASH OUT <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-600">FASTER.</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-10 font-light">
                            Bidora is India's premier 'sneaker resell platform'. We've eliminated the friction of selling rare footwear. No more endless WhatsApp chats, no more ghosting, and absolutely no fake offers.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/auth" className="px-10 py-4 bg-yellow-400 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform shadow-2xl">
                                START LISTING
                            </Link>
                        </div>
                    </FadeIn>
                    <div className="relative">
                        <FadeIn delay={0.2}>
                            <div className="aspect-square bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent p-12 flex flex-col justify-end">
                                    <h3 className="text-3xl font-black mb-4">Highest Sold on Bidora</h3>
                                    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-fit">
                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-black">Air Jordan 1 Dior</p>
                                            <p className="text-xl font-black text-white">₹7,42,000</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-40">
                    {FEATURES.map((feat, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className="p-10 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] hover:bg-zinc-900/60 hover:border-yellow-500/30 transition-all duration-500 h-full group">
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                                    <feat.icon className="w-6 h-6 text-gray-400 group-hover:text-yellow-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-4 tracking-tight">{feat.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Content Rich Section for SEO */}
                <FadeIn delay={0.3}>
                    <div className="prose prose-invert max-w-none border-t border-white/5 pt-32">
                        <h2 className="text-4xl font-black text-white mb-10">How to Sell Sneakers in India: The Bidora Playbook</h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                            If you're wondering 'how to sell limited edition sneakers in India' for the max possible price, you're in the right place. Bidora's auction model is designed to maximize the seller's return by creating true 'price discovery' through transparency.
                        </p>

                        <div className="grid md:grid-cols-3 gap-12 mb-20">
                            <div>
                                <h4 className="flex items-center gap-2 text-white font-bold mb-4">
                                    <Camera className="w-5 h-5 text-yellow-500" /> 1. Prime Photography
                                </h4>
                                <p className="text-gray-500 text-sm leading-relaxed">Great photos make great sales. Shoot your 'sneakers' in natural daylight. Include clear shots of the lateral sides, heels, outsoles, and the size tag on the box. Transparency builds trust.</p>
                            </div>
                            <div>
                                <h4 className="flex items-center gap-2 text-white font-bold mb-4">
                                    <CheckCircle className="w-5 h-5 text-yellow-500" /> 2. Accurate Condition
                                </h4>
                                <p className="text-gray-500 text-sm leading-relaxed">Be honest about the condition. Whether they are 'Deadstock' (DS), 'Near Deadstock' (NDS), or 'VNDS', providing an accurate description prevents delivery disputes and helps 'sell sneakers India' faster.</p>
                            </div>
                            <div>
                                <h4 className="flex items-center gap-2 text-white font-bold mb-4">
                                    <DollarSign className="w-5 h-5 text-yellow-500" /> 3. Fair Starting Bid
                                </h4>
                                <p className="text-gray-500 text-sm leading-relaxed">A competitive starting bid attracts more 'sneakerheads' and drives higher bidding volume. Check the recent 'sneaker resell price India' to set an attractive entry point for bidders.</p>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-6">Why Indian Sellers Prefer Bidora Over Instagram</h3>
                        <p className="text-gray-400 text-base leading-relaxed mb-6">
                            Selling on social media is a nightmare for Indian resellers. You deal with 'low-ballers', 'scammers', and 'inconsistent buyers'. On Bidora, we've automated the entire trust layer. Every buyer has a 'locked wallet' with the funds ready to be paid. This means a 99% close rate on won auctions. This is the future of 'online sneaker marketplace India'.
                        </p>

                        <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/10 mt-20">
                            <h4 className="text-white font-black text-2xl mb-6">Seller FAQ</h4>
                            <div className="space-y-8">
                                <div>
                                    <h5 className="text-yellow-400 font-bold mb-2">What are the seller fees in India?</h5>
                                    <p className="text-gray-400 text-sm">Bidora charges a flat 8.5% commission on every successful auction. This includes authentication, escrow management, and premium support. No hidden charges.</p>
                                </div>
                                <div>
                                    <h5 className="text-yellow-400 font-bold mb-2">How long does authentication take?</h5>
                                    <p className="text-gray-400 text-sm">Our Mumbai center verifies items within 24-48 hours of arrival. Once authenticated, funds are processed for immediate payout via UPI or IMPS.</p>
                                </div>
                                <div>
                                    <h5 className="text-yellow-400 font-bold mb-2">Do you provide shipping assistance?</h5>
                                    <p className="text-gray-400 text-sm">Yes, we provide a pre-paid shipping label via our partners for all 'live sneaker auctions' in India. Simply pack the kicks, stick the label, and wait for pickup.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.4}>
                    <div className="mt-40 text-center">
                        <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">UNLEASH YOUR COLLECTION.</h2>
                        <Link href="/create-auction" className="inline-flex items-center gap-3 px-12 py-5 bg-yellow-400 text-black font-black uppercase tracking-widest rounded-2xl hover:translate-x-2 transition-all">
                            LIST A SNEAKER NOW <ArrowRight className="w-6 h-6" />
                        </Link>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
