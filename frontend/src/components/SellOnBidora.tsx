'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        emoji: '🆓',
        title: 'Zero Commission',
        body: 'Your first 5 listings are completely free. No catch.',
        gradient: 'from-yellow-500/10 to-transparent',
        borderHover: 'hover:border-yellow-400/30',
    },
    {
        emoji: '✅',
        title: 'Bidora Verified Badge',
        body: 'Get certified. Stand out. Buyers trust verified sellers 3x more.',
        gradient: 'from-blue-500/10 to-transparent',
        borderHover: 'hover:border-blue-400/30',
    },
    {
        emoji: '📈',
        title: 'Real Demand, Real Prices',
        body: '12,000+ active bidders competing for YOUR inventory every week.',
        gradient: 'from-green-500/10 to-transparent',
        borderHover: 'hover:border-green-400/30',
    },
];

export default function SellOnBidora() {
    return (
        <section className="py-24 relative overflow-hidden bg-black/20 border-t border-white/5">
            {/* Ambient background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[300px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 max-w-7xl relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-16"
                >
                    <p className="text-yellow-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">Become a Seller</p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 text-white">
                        GOT RARE KICKS?{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600">
                            TURN THEM INTO CASH.
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        Join 200+ verified sellers already earning on Bidora. List in 2 minutes.
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-14">
                    {features.map((feat, i) => (
                        <motion.div
                            key={feat.title}
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <div className={`relative bg-zinc-900/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 h-full group overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] ${feat.borderHover}`}>
                                {/* Hover gradient overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />

                                <div className="relative z-10">
                                    <p className="text-4xl mb-6">{feat.emoji}</p>
                                    <h3 className="text-white font-black text-xl mb-3 tracking-tight">{feat.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{feat.body}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-center"
                >
                    <Link
                        href="/dashboard?tab=listings"
                        className="inline-flex items-center gap-3 bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 px-10 py-5 rounded-2xl font-black text-lg hover:-translate-y-1 transition-all duration-300 shadow-[0_15px_40px_-5px_rgba(250,204,21,0.5)] hover:shadow-[0_20px_50px_-5px_rgba(250,204,21,0.7)] border border-yellow-300"
                    >
                        BECOME A SELLER
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </motion.div>

            </div>
        </section>
    );
}
