'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Search, Zap, Crosshair, Eye, PenTool, Box, Check } from 'lucide-react';
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

const CHECKLIST = [
    { title: "Box & Labels", desc: "We check fonts, spacing, gloss levels, and UV stamps on the original box labels. Fakes often fail on box structural integrity and label adhesive quality." },
    { title: "Material Feel", desc: "Our experts know exactly how 'Chicago 1' leather feels vs. a 'Jordan 4' nubuck. We check for grain texture, flexibility, and scent." },
    { title: "Stitching Patterns", desc: "Every Nike and Adidas factory has specific stitch counts and patterns. We verify consistent spacing and tension across every seam." },
    { title: "Internal Structure", desc: "We pull the insoles. We check the 'strobel' stitching, footbed markings, and the glue patterns hidden deep inside the kicks." },
    { title: "UV Light Scan", desc: "Many high-end 'reps' use invisible ink markings from unauthorized factories. Our UV scan reveals these hidden fraud indicators instantly." },
    { title: "Weight Verification", desc: "Authentic materials have a very specific weight tolerance. Every sneaker is weighed to the gram against our verified database." }
];

export default function SneakerAuthentication() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white pt-32 pb-40 selection:bg-yellow-500/30">
            {/* SEO Hidden H1 */}
            <h1 className="sr-only">Sneaker Authentication Guide India | How Bidora Verifies Authentic Kicks</h1>

            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[-10%] w-[50vw] h-[50vw] bg-yellow-500/[0.04] blur-[150px] rounded-full" />
                <div className="absolute bottom-0 right-[-10%] w-[60vw] h-[60vw] bg-blue-500/[0.03] blur-[150px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 max-w-5xl relative z-10">
                <FadeIn>
                    <div className="text-center mb-32">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full mb-8">
                            <ShieldCheck className="w-4 h-4 text-yellow-500" />
                            <span className="text-[10px] font-black tracking-[0.2em] text-yellow-400 uppercase">Our Gold Standard</span>
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 italic leading-[0.9]">
                            ONLY<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-600">THE REAL.</span>
                        </h2>
                        <p className="text-gray-400 text-xl font-light max-w-2xl mx-auto leading-relaxed">
                            Welcome to India's most advanced 'sneaker authentication service'. At Bidora, we don't just 'look' at shoes — we architect trust through a multi-point verification protocol.
                        </p>
                    </div>
                </FadeIn>

                {/* Main Content Grid for SEO */}
                <div className="grid md:grid-cols-2 gap-20 items-center mb-40">
                    <FadeIn>
                        <h3 className="text-4xl font-black mb-8 tracking-tight">The Problem: High-End Fakes in India</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            The Indian 'sneaker market' is currently flooded with 'UA' (Unauthorized Authentic), 'Master Copies', and high-end replicas. These fakes are designed to fool the untrained eye, often using almost-correct materials and packaging.
                        </p>
                        <p className="text-gray-500 leading-relaxed mb-8">
                            If you are trying to 'buy Air Jordan India' or 'buy verified Yeezy', you need a partner who understands the deep technicalities of footwear manufacturing. That's where Bidora's authentication team steps in. We analyze over 150 data points on every single pair before it gets the Bidora Verified Seal.
                        </p>
                        <div className="space-y-4">
                            {['Authentication in Mumbai', 'Global Database Access', 'Expert In-Hand Review', 'Proprietary Image Analysis'].map((item) => (
                                <div key={item} className="flex items-center gap-3 text-sm font-bold text-gray-300">
                                    <Check className="w-5 h-5 text-yellow-500" /> {item}
                                </div>
                            ))}
                        </div>
                    </FadeIn>
                    <div className="relative aspect-square">
                        <FadeIn delay={0.2}>
                            <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-[4rem] group overflow-hidden">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Crosshair className="w-40 h-40 text-yellow-500/10 group-hover:scale-110 transition-transform duration-700" />
                                </div>
                                <div className="absolute bottom-10 left-10 right-10 p-8 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl">
                                    <p className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-2">Internal Scan</p>
                                    <p className="text-white text-sm font-medium">Every seam is checked for consistent stitch count per inch (SPI).</p>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>

                {/* Detail Sections */}
                <div className="space-y-40">
                    <FadeIn>
                        <h3 className="text-4xl font-black text-center mb-20 tracking-tight italic">OUR 6-POINT CHECKLIST</h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {CHECKLIST.map((item, i) => (
                                <div key={i} className="p-10 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] hover:bg-zinc-900/60 hover:border-yellow-500/20 transition-all duration-500">
                                    <div className="w-12 h-12 bg-yellow-400/10 rounded-xl flex items-center justify-center mb-8">
                                        <ShieldCheck className="w-6 h-6 text-yellow-500" />
                                    </div>
                                    <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </FadeIn>

                    <FadeIn>
                        <div className="prose prose-invert max-w-none pt-20 border-t border-white/5">
                            <h2 className="text-4xl font-black text-white mb-10">How to Spot Fake Sneakers in India: Expert Insights</h2>
                            <p className="text-gray-400 text-lg leading-relaxed mb-10">
                                Knowledge is the best defense against 'fake sneakers India'. While Bidora handles the authentication for you, we believe every 'sneakerhead' should know the basics of 'how to spot fake sneakers'.
                            </p>

                            <div className="grid md:grid-cols-2 gap-12 mb-20">
                                <div className="space-y-8">
                                    <div className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10">
                                            <Search className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-2">Check the 'Scent'</h4>
                                            <p className="text-gray-500 text-sm">Authentic Nike and Jordan sneakers use specific glue formulations. Replicas often have an overpowering chemical or 'plastic' smell from cheaper adhesives used in illicit factories.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10">
                                            <Eye className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-2">The 'Boost' Test</h4>
                                            <p className="text-gray-500 text-sm">For 'Adidas Yeezy authentic', the boost material should be soft, bouncy, and have defined 'pellets'. Fake boost is often too stiff or looks like a solid block of molded plastic.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10">
                                            <PenTool className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-2">Font Consistency</h4>
                                            <p className="text-gray-500 text-sm">Look at the size tag on the inside of the shoe. Authentic fonts are crisp and consistent. Replicas often have 'bleeding' ink or inconsistent bolding on the SKUs and dates.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="flex-shrink-0 w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10">
                                            <Box className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold mb-2">The 'Lace' Wrap</h4>
                                            <p className="text-gray-400 text-sm">Factory-laced Jordans follow a very specific pattern. While not a definitive proof, sloppy or incorrect lacing on a 'Deadstock' pair is a major red flag for 'fake Nike sneakers India'.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-white mb-6">Bidora's Zero-Tolerance Authentication Policy</h3>
                            <p className="text-gray-400 leading-relaxed mb-10">
                                If an item fails our 'sneaker authentication service', we don't just 'send it back'. We flag the seller on our platform and return the item at their cost. If a seller is found to be intentionally selling 'replicas', they are permanently banned from Bidora. This 'zero-tolerance' approach is why we are the 'best sneaker marketplace India'.
                            </p>

                            <div className="p-12 bg-zinc-900/50 rounded-[3rem] border border-white/10">
                                <h4 className="text-white font-black text-xl mb-6 flex items-center gap-3">
                                    <Zap className="w-6 h-6 text-yellow-500" /> Why Humans Matter More Than AI
                                </h4>
                                <p className="text-gray-500 text-base leading-relaxed mb-6">
                                    While we use technology to assist, the final decision on Bidora is always made by a human expert with years of in-hand experience. An algorithm can miss the exact 'grain' of a certain leather or the way a certain mesh 'feels'. Our authenticators are 'sneaker collectors' who live and breathe this culture.
                                </p>
                                <p className="text-gray-500 text-sm italic font-medium">"Machine learning assists. Expert hands verify. That is the Bidora promise."</p>
                            </div>
                        </div>
                    </FadeIn>
                </div>

                <FadeIn delay={0.4}>
                    <div className="mt-40 p-16 bg-white/[0.03] border border-white/10 rounded-[4rem] text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter">BID WITH 100% CONFIDENCE.</h2>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/search" className="px-12 py-5 bg-yellow-400 text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-transform shadow-2xl">
                                EXPLORE AUTHENTIC KICKS
                            </Link>
                            <Link href="/how-it-works" className="px-12 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors">
                                THE ESCROW SYSTEM
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}
