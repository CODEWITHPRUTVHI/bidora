'use client';

import { motion } from 'framer-motion';
import { Search, Wallet, Gavel, Truck, ShieldCheck, Lock, CheckCircle, Zap } from 'lucide-react';
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

const STEPS = [
    {
        icon: Search,
        title: "1. Discover Rare Drops",
        description: "Explore our curated feed of live sneaker auctions. From vintage Air Jordans to the latest Yeezy releases, Bidora brings India's most exclusive kicks into one live dashboard. Use our advanced filters to sort by brand, size, colorway, or ending time.",
        longDesc: "The hunt starts here. Every listing on Bidora is vetted for quality and authenticity before it even goes live. We feature detailed high-resolution photography, condition reports, and original retail information so you know exactly what you're bidding on. Whether you are a hardcore 'collector' or a first-time 'sneakerhead' in India, our platform makes discovery effortless."
    },
    {
        icon: Wallet,
        title: "2. Secure Your Funds",
        description: "Add funds to your Bidora Wallet via UPI, NetBanking, or Credit Card. Your money is held in a secure India-based escrow account until you win and confirm the delivery of your sneakers.",
        longDesc: "Safety is our DNA. Unlike traditional marketplaces where you pay a seller directly and hope for the best, Bidora uses a 'Buyer Protection' protocol. When you add funds, they are locked. This proves to the seller that you are a serious bidder and ensures that your money is untouchable by anyone until the transaction is successfully completed. This is the gold standard for 'sneaker auctions in India'."
    },
    {
        icon: Gavel,
        title: "3. Bid in Real-Time",
        description: "Participate in high-octane live auctions with zero lag. Our WebSocket technology ensures that every bid is recorded instantly. Set your maximum bid and let our proxy engine handle the fight for you.",
        longDesc: "The auction floor is where the adrenaline is. Bidora's custom-built bidding engine is engineered for speed. In the fast-paced world of 'sneaker reselling in India', a millisecond can be the difference between a win and a loss. You can bid manually or use our smart 'Auto-Bid' feature, which increments your bid automatically up to your set limit. It's the most transparent 'live bidding' experience in the country."
    },
    {
        icon: Truck,
        title: "4. Authentication & Delivery",
        description: "Once you win, the seller ships the item for verification. Our experts inspect every stitch, material, and box detail. Only after a 100% pass is the item shipped to your doorstep in India.",
        longDesc: "We take 'verified sneakers' seriously. After a successful win, the seller must ship the item within 48 hours. Our authentication centers in Mumbai examine the kicks against our massive database of retail units. We check the 'boost' texture, the smell of the leather, and even the box labels under UV light. If it's fake, you get an immediate 100% refund. If it's real, it's delivered to you via our premium shipping partners like BlueDart or Delhivery."
    }
];

export default function HowItWorks() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-32 pb-20 selection:bg-yellow-500/30">
            {/* SEO Hidden H1 */}
            <h1 className="sr-only">How Bidora Works — India's Most Trusted Sneaker Auction Process</h1>

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50vh] bg-yellow-500/[0.05] blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                <FadeIn>
                    <div className="text-center mb-20">
                        <p className="text-yellow-500 text-xs font-black uppercase tracking-[0.3em] mb-4">The Protocol</p>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 italic">HOW IT WORKS.</h2>
                        <div className="h-1 w-20 bg-yellow-500 mx-auto" />
                    </div>
                </FadeIn>

                <div className="space-y-32">
                    {STEPS.map((step, i) => (
                        <FadeIn key={i} delay={i * 0.1}>
                            <div className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-2xl">
                                        <step.icon className="w-8 h-8 text-yellow-400" />
                                    </div>
                                    <h3 className="text-3xl font-black mb-6 tracking-tight text-white">{step.title}</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-6 font-medium">
                                        {step.description}
                                    </p>
                                    <p className="text-gray-500 text-base leading-relaxed">
                                        {step.longDesc}
                                    </p>
                                </div>
                                <div className={`relative aspect-square bg-zinc-900/50 rounded-[3rem] border border-white/5 overflow-hidden group ${i % 2 === 1 ? 'md:order-1' : ''}`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <step.icon className="w-40 h-40 text-white/5 group-hover:text-yellow-500/10 transition-colors duration-700" />
                                    </div>
                                    {/* Number Watermark */}
                                    <span className="absolute -bottom-10 -right-10 text-[15rem] font-black text-white/[0.02] select-none pointer-events-none">
                                        {i + 1}
                                    </span>
                                </div>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* Additional SEO Content Section */}
                <FadeIn delay={0.5}>
                    <div className="mt-40 prose prose-invert max-w-none border-t border-white/5 pt-20">
                        <h2 className="text-4xl font-black text-white mb-10 tracking-tight">The Bidora Edge: Why Our Auction Model Wins</h2>
                        <p className="text-gray-400 text-lg leading-relaxed mb-8">
                            Traditional marketplaces in India are flooded with 'fakes', 'replicas', and 'unscrupulous sellers'. Bidora was built by sneaker collectors to solve these exact pain points. By integrating a high-speed live bidding engine with an India-exclusive escrow system, we've created a 'zero-fraud environment' for buying and selling rare footwear.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-8 mb-12">
                            <div className="p-8 bg-zinc-900/50 rounded-3xl border border-white/5">
                                <h4 className="text-yellow-400 font-bold mb-4 uppercase tracking-widest text-sm">Escrow Protection</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">Your funds never leave our platform until the sneakers are in your hands and verified. This eliminates 'payment-first' scams rampant on Instagram and OLX.</p>
                            </div>
                            <div className="p-8 bg-zinc-900/50 rounded-3xl border border-white/5">
                                <h4 className="text-yellow-400 font-bold mb-4 uppercase tracking-widest text-sm">Real-Time Engine</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">Built on high-performance WebSockets, our bidding engine eliminates lag, ensuring that every bid in the final seconds is accurately recorded.</p>
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions (FAQ)</h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-white font-bold mb-2">Is Bidora safe for buying sneakers in India?</h4>
                                <p className="text-gray-500 text-sm">Yes. Every transaction is protected by our escrow system. We serve thousands of collectors across Mumbai, Delhi, Bangalore, and all major Indian cities with a 100% security record.</p>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-2">How do I know the sneakers are authentic?</h4>
                                <p className="text-gray-500 text-sm">Our authentication team in India inspectes every winning auction. We use a multi-point verification checklist including material feel, UV light checks, and box inspection.</p>
                            </div>
                            <div>
                                <h4 className="text-white font-bold mb-2">What happens if I lose an auction?</h4>
                                <p className="text-gray-500 text-sm">Nothing! Your funds remain in your Bidora Wallet and can be withdrawn back to your bank account or UPI instantly at any time.</p>
                            </div>
                        </div>
                    </div>
                </FadeIn>

                <FadeIn delay={0.3}>
                    <div className="mt-32 p-16 bg-gradient-to-br from-yellow-500/20 to-zinc-950 border border-yellow-500/20 rounded-[3rem] text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter italic">READY TO HUNT?</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/auth" className="px-12 py-5 bg-yellow-400 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform">
                                CREATE FREE ACCOUNT
                            </Link>
                            <Link href="/search" className="px-12 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors">
                                EXPLORE LIVE DROPS
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
