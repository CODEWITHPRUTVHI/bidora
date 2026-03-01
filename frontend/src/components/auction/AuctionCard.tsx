import { Timer, ArrowUpRight, CheckCircle2, Heart, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export interface AuctionProps {
    id: string;
    title: string;
    category: string;
    image: string;
    currentBid: number;
    totalBids: number;
    timeLeft: string;
    isLive: boolean;
    sellerVerified: boolean;
    isWatched?: boolean;
}

export default function AuctionCard({ auction }: { auction: AuctionProps }) {
    const isHot = auction.totalBids > 10;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative flex flex-col bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden hover:border-yellow-400/30 transition-all duration-500 shadow-xl"
        >
            {/* Image Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-black/50">
                <Image
                    src={auction.image}
                    alt={auction.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    loading="lazy"
                />

                {/* Status Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {auction.isLive && (
                        <div className="flex items-center bg-red-500/90 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-red-500/20 backdrop-blur-md text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-white mr-2 animate-pulse" />
                            LIVE
                        </div>
                    )}
                    {isHot && (
                        <div className="flex items-center bg-orange-500/90 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-orange-500/20 backdrop-blur-md text-white">
                            <Flame className="w-3 h-3 mr-1.5 fill-white" />
                            HOT
                        </div>
                    )}
                </div>

                {/* Save Button (Static UI here, parent should handle logic) */}
                <button className={`absolute top-4 right-4 p-2 rounded-xl backdrop-blur-md border transition-all z-20 ${auction.isWatched ? 'bg-red-500/20 border-red-500/30 text-red-500' : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-black/60'}`}>
                    <Heart className={`w-4 h-4 ${auction.isWatched ? 'fill-current' : ''}`} />
                </button>

                {/* Category Tag (Moved down if badges conflict) */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white/90 text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full border border-white/10 uppercase z-10">
                    {auction.category}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="mb-4">
                    <h3 className="font-black text-lg text-white group-hover:text-yellow-400 transition-colors line-clamp-1 tracking-tight">{auction.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        {auction.sellerVerified && (
                            <div className="flex items-center text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                            </div>
                        )}
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">• {auction.totalBids} Bids</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-end justify-between">
                    <div className="space-y-0.5">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Current Bid</p>
                        <p className="text-2xl font-black text-white">
                            ₹{auction.currentBid.toLocaleString()}
                        </p>
                    </div>

                    <div className="text-right space-y-0.5">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Time Left</p>
                        <div className="flex items-center text-red-400 font-black text-sm justify-end tabular-nums">
                            <Timer className="w-3.5 h-3.5 mr-1.5" />
                            {auction.timeLeft}
                        </div>
                    </div>
                </div>

                {/* Hover Button - More premium transition */}
                <div className="absolute inset-0 bg-yellow-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-full group-hover:translate-y-0 z-10 pointer-events-none">
                    <Link href={`/auctions/${auction.id}`} className="flex items-center gap-3 text-black font-black text-lg pointer-events-auto">
                        <span>Place Bid Now</span>
                        <ArrowUpRight className="w-6 h-6" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
