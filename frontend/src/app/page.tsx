'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import HeroSection from '@/components/ui/HeroSection';
import LiveBidsGrid from '@/components/auction/LiveBidsGrid';
import { Shield, Zap, CheckCircle, ArrowRight, TrendingUp, Users, Award, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';

// ── Scroll-reveal wrapper ───────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '', scale = false }: { children: React.ReactNode; delay?: number; className?: string; scale?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 30, scale: scale ? 0.95 : 1 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Stats ────────────────────────────────────────────────────────────
const STATS = [
  { value: '₹2.4Cr+', label: 'Total Auction Volume', icon: TrendingUp },
  { value: '12,000+', label: 'Active Bidders', icon: Users },
  { value: '99.2%', label: 'Escrow Success Rate', icon: Shield },
  { value: '4.8★', label: 'Avg. Seller Rating', icon: Award },
];

// ── How it works ─────────────────────────────────────────────────────
const STEPS = [
  { step: '01', title: 'Browse & Discover', desc: 'Explore live auctions across electronics, fashion, art, and collectibles.', color: 'from-yellow-500/10 to-transparent border-yellow-500/10' },
  { step: '02', title: 'Fund Your Wallet', desc: 'Deposit securely using Stripe. Funds are held in escrow until the deal is complete.', color: 'from-blue-500/10 to-transparent border-blue-500/10' },
  { step: '03', title: 'Bid in Real-Time', desc: 'Place bids with our live WebSocket engine. Auto-bid up to your maximum limit.', color: 'from-purple-500/10 to-transparent border-purple-500/10' },
  { step: '04', title: 'Win & Track', desc: 'Winner gets notified instantly. Funds release from escrow only after confirmed delivery.', color: 'from-green-500/10 to-transparent border-green-500/10' },
];

// ── Trust features ────────────────────────────────────────────────────
const TRUST_FEATURES = [
  { icon: Lock, title: 'Escrow Protection', desc: 'Every rupee is held securely until the buyer confirms delivery.' },
  { icon: Zap, title: 'Real-Time Bidding', desc: 'WebSocket-powered live auctions with zero lag.' },
  { icon: CheckCircle, title: 'Verified Sellers', desc: 'All sellers go through identity verification before listing.' },
  { icon: Shield, title: 'Buyer Guarantee', desc: 'Full refund if the item is not as described or not received.' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="overflow-hidden relative min-h-screen bg-zinc-950 text-white selection:bg-yellow-500/30">

      {/* ── Ambient Background Orbs ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-yellow-500/[0.07] blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10">
        <HeroSection />

        {/* ── Trust Bar ──────────────────────────────────────────── */}
        <section className="border-y border-white/5 bg-black/40 py-6 backdrop-blur-xl relative z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="container mx-auto px-6">
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-gray-400 text-sm font-semibold tracking-wide">
              {[
                { icon: Shield, text: 'BANK-GRADE ESCROW' },
                { icon: CheckCircle, text: 'VERIFIED SELLERS' },
                { icon: Zap, text: 'REAL-TIME WEBSOCKETS' },
                { icon: Lock, text: 'BUYER PROTECTION' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                  <Icon className="w-5 h-5 text-yellow-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <section className="py-24 relative">
          <div className="absolute inset-0 bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none w-[70%] left-1/2 -translate-x-1/2" />
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <FadeIn key={stat.label} delay={i * 0.1}>
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-3xl p-8 flex flex-col items-center text-center hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 group">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/10 group-hover:scale-110 transition-all duration-300">
                        <Icon className="w-6 h-6 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <p className="text-3xl lg:text-4xl font-black tracking-tight text-white mb-2">{stat.value}</p>
                      <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Live Auctions Grid ─────────────────────────────────── */}
        <FadeIn>
          <LiveBidsGrid />
        </FadeIn>

        {/* ── How It Works ───────────────────────────────────────── */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6 max-w-7xl">
            <FadeIn className="text-center mb-20">
              <p className="text-yellow-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">Simple Process</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">HOW BIDORA WORKS</h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">From discovery to delivery — a seamless, secure auction experience engineered for precision in four simple steps.</p>
            </FadeIn>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-20">
              {STEPS.map((step, i) => (
                <FadeIn key={step.step} delay={i * 0.15} scale>
                  <div className={`bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 h-full hover:bg-zinc-800/60 hover:border-white/20 hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.3)]`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <p className="text-7xl font-black text-white/5 mb-6 group-hover:text-white/10 transition-colors">{step.step}</p>
                    <h3 className="font-bold text-white text-xl mb-3 tracking-tight">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                    <div className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust Features ─────────────────────────────────────── */}
        <section className="py-24 border-t border-white/5 bg-black/30">
          <div className="container mx-auto px-6 max-w-7xl">
            <FadeIn className="text-center mb-16">
              <p className="text-yellow-500 text-sm font-bold uppercase tracking-[0.2em] mb-4">Why Bidora</p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">BUILT FOR TRUST</h2>
            </FadeIn>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {TRUST_FEATURES.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <FadeIn key={feat.title} delay={i * 0.1}>
                    <div className="group bg-white/[0.02] border border-white/[0.05] rounded-3xl p-8 hover:bg-white/[0.06] hover:border-yellow-500/30 transition-all duration-300 h-full">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-yellow-500/10 transition-colors">
                        <Icon className="w-6 h-6 text-gray-300 group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <h3 className="font-bold text-lg text-white mb-3">{feat.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <section className="relative py-20 md:py-40 px-6 overflow-hidden mt-12 border-t border-white/5 bg-gradient-to-b from-transparent to-zinc-950/80">
          <div className="absolute inset-0 bg-yellow-500/10 blur-[150px] rounded-full pointer-events-none w-[80%] left-[10%] mix-blend-screen" />
          <FadeIn className="relative z-10 text-center max-w-4xl mx-auto" scale>
            <div className="inline-flex justify-center items-center py-2 px-6 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-8 backdrop-blur-md">
              <p className="text-yellow-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Join The Elite Platform Today</p>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tighter leading-[1.05] drop-shadow-2xl">
              START WINNING<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600">RARE AUCTIONS</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Join thousands of collectors and enthusiasts. Deposit funds securely and bid on exclusive, verified items with our zero-lag real-time engine.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {!user ? (
                <>
                  <Link href="/auth"
                    className="w-full sm:w-auto bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black text-base md:text-lg hover:-translate-y-1 transition-all duration-300 shadow-[0_15px_40px_-5px_rgba(250,204,21,0.6)] hover:shadow-[0_20px_50px_-5px_rgba(250,204,21,0.8)] border border-yellow-300 flex items-center justify-center gap-3">
                    Create Free Account <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
                  </Link>
                  <Link href="/search?status=LIVE"
                    className="w-full sm:w-auto px-8 py-4 md:px-12 md:py-5 rounded-2xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 backdrop-blur-md transition-all duration-300 flex items-center justify-center">
                    Browse Live Auctions
                  </Link>
                </>
              ) : (
                <Link href="/dashboard"
                  className="w-full sm:w-auto bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black text-base md:text-lg hover:-translate-y-1 transition-all duration-300 shadow-[0_15px_40px_-5px_rgba(250,204,21,0.6)] border border-yellow-300 flex items-center justify-center gap-3">
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              )}
            </div>
          </FadeIn>
        </section>
      </div>
    </div>
  );
}
