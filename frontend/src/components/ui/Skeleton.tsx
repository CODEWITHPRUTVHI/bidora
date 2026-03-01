import { motion } from 'framer-motion';

export function Skeleton({ className }: { className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className={`bg-white/5 rounded-lg ${className}`}
        />
    );
}

export function AuctionCardSkeleton() {
    return (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-xl p-5 space-y-5">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <div className="flex gap-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20 rounded-full" />
                </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-20" />
                </div>
            </div>
        </div>
    );
}
