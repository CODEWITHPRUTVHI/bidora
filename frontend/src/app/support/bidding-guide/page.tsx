import Link from 'next/link';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl prose prose-invert">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">Bidding Guide</h1>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                    Learn how to secure priority access to rare items, place auto-bids, and win auctions at the exact right moment on Bidora.
                </p>
                <h2 className="text-2xl font-black text-white mt-12 mb-4">The Golden Rules of Bidding</h2>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                    <li><strong>Fund your Wallet:</strong> All bids required secured funds.</li>
                    <li><strong>Anti-Snipe:</strong> If a bid is placed in the final 30 seconds, the clock resets to 10 seconds to allow others to react.</li>
                    <li><strong>Auto-Bid:</strong> Set a maximum limit and let the system bid the lowest possible winning amount up to your ceiling.</li>
                </ul>
                <div className="mt-12 pt-8 border-t border-white/10">
                    <Link href="/" className="text-yellow-400 font-bold hover:underline">← Return to Marketplace</Link>
                </div>
            </div>
        </div>
    );
}
