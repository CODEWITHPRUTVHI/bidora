'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, CreditCard, RotateCcw, AlertCircle, CheckCircle, Zap } from 'lucide-react';
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

export default function BuyerProtection() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-32 pb-40 selection:bg-yellow-500/30">
            {/* SEO Hidden H1 */}
            <h1 className="sr-only">Buyer Protection & Escrow India | 100% Safe Sneaker Buying on Bidora</h1>

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-yellow-500/[0.04] blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-500/[0.03] blur-[150px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                <FadeIn>
                    <div className="text-center mb-32">
                        <p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">India's Safest Marketplace</p>
                        <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 italic leading-[0.9]">
                            RUPEE-ONE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-600">PROTECTED.</span>
                        </h2>
                        <p className="text-gray-400 text-xl font-light max-w-2xl mx-auto leading-relaxed">
                            Buying rare sneakers shouldn't feel like a gamble. With Bidora's 'escrow protection India', your money is safe from the moment you bid until the moment you flex.
                        </p>
                    </div>
                </FadeIn>

                <div className="grid md:grid-cols-2 gap-12 mb-40">
                    <FadeIn delay={0.1}>
                        <div className="p-12 bg-zinc-900/60 border border-white/10 rounded-[4rem] h-full">
                            <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center mb-10 border border-yellow-400/20">
                                <Lock className="w-8 h-8 text-yellow-500" />
                            </div>
                            <h3 className="text-3xl font-black mb-6 tracking-tight">The Escrow Protocol</h3>
                            <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                In 'online sneaker auctions India', the biggest risk is the seller taking the money and disappearing. Bidora solves this. Your funds are held in a secure, audited escrow account. We only release the money to the seller <span className="text-white font-bold italic underline decoration-yellow-400/30">after</span> we have authenticated the item and you have received it.
                            </p>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <div className="p-12 bg-zinc-900/60 border border-white/10 rounded-[4rem] h-full flex flex-col justify-end">
                            <h4 className="text-sm font-black text-yellow-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Safe Buying Features</h4>
                            <div className="space-y-6">
                                {[
                                    { icon: CreditCard, title: "Secure Checkout", desc: "UPI, Cards, and NetBanking via India's top gateways." },
                                    { icon: RotateCcw, title: "Instant Refunds", desc: "Fail authentication? Get 100% of your money back in 24 hours." },
                                    { icon: AlertCircle, title: "Dispute Support", desc: "Concierge level help for any delivery issues in India." }
                                ].map((feat, i) => (
                                    <div key={i} className="flex gap-4">
                                        <feat.icon className="w-6 h-6 text-gray-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-white font-bold text-sm">{feat.title}</p>
                                            <p className="text-gray-500 text-xs leading-relaxed">{feat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>
                </div>

                {/* Content Rich Section for SEO */}
                <FadeIn delay={0.3}>
                    <div className="prose prose-invert max-w-none border-t border-white/5 pt-32">
                        <h2 className="text-4xl font-black text-white mb-10 tracking-tight italic">Why 'Buyer Guarantee' is Mandatory for India</h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-10">
                            The 'Indian sneaker market' operates differently than the US or Europe. Trust is harder to build and easier to break. We realized that for a 'sneaker marketplace India' to truly succeed, the risk must be shifted entirely away from the buyer.
                        </p>

                        <div className="grid md:grid-cols-2 gap-12 mb-20">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-6">1. Authentic or 100% Refund</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Our 'sneaker authentication India' team is your first line of defense. If a seller sends a fake, our internal logic flags it, blocks the payout, and initializes an immediate refund to your source account. No questions asked. This is the cornerstone of 'safe sneaker buying India'.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-6">2. Shipping & Damage Protection</h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Every item shipped on Bidora is insured against loss or damage during transit in India. From the seller's home to our authentication center, and then to your doorstep — we own the risk. If the box is crushed or the pair is lost, you are 100% covered.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/10 mt-20 text-center">
                            <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-8 animate-pulse" />
                            <h3 className="text-3xl font-black text-white mb-6 tracking-tight italic">TRANSPARENT DISPUTE RESOLUTION</h3>
                            <p className="text-gray-400 text-base leading-relaxed mb-10 max-w-3xl mx-auto">
                                If you receive an item and it contradicts the 'condition report', you have 24 hours to raise a dispute. Our team will review the original listing photos against your received item. Our 'dispute resolution flow' is unbiased and geared towards maintaining the highest standard of 'authentic sneakers India'.
                            </p>
                        </div>

                        <h3 className="text-2xl font-black text-white mt-32 mb-8">Frequently Asked Questions (FAQ)</h3>
                        <div className="grid sm:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <h4 className="text-white font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4 text-yellow-500" /> How long does a refund take?</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">Refunds for failed authentication are processed within 24 hours. Depending on your bank, the 'UPI refund' or 'card refund' in India should reflect in 3-5 business days.</p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-white font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4 text-yellow-500" /> Is my payment data secure?</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">We use PCI-DSS compliant payment gateways in India. Bidora never stores your credit card or bank login details on our servers.</p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-white font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4 text-yellow-500" /> What if the seller ghosts?</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">If a seller doesn't ship within the timeframe, the auction is cancelled automatically, and your funds are released from escrow back to your wallet instantly.</p>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.4}>
                    <div className="mt-40 text-center">
                        <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">REST EASY. BID HARD.</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth" className="px-12 py-5 bg-yellow-400 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform shadow-2xl">
                                JOIN THE COMMUNITY
                            </Link>
                            <Link href="/search" className="px-12 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors">
                                SEE LIVE AUCTIONS
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
