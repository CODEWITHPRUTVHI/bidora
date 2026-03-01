import Link from 'next/link';

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl text-gray-300">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">Terms of Service</h1>
                <p className="text-sm text-gray-500 font-bold mb-8 uppercase tracking-widest">Last Updated: February 2026</p>

                <div className="space-y-6 leading-relaxed">
                    <h2 className="text-2xl font-black text-white">1. Acceptance of Terms</h2>
                    <p>By using Bidora, you agree to these legally binding rules regarding real-time bidding, payments, and behavioral guidelines.</p>

                    <h2 className="text-2xl font-black text-white">2. Bidding Commitments</h2>
                    <p>All bids placed on Bidora are legally binding. Failure to complete payment via escrow will result in immediate account suspension and potential legal action.</p>

                    <h2 className="text-2xl font-black text-white">3. Platform Fees</h2>
                    <p>Bidora charges a standard operating fee deducted from the final sale value from the seller prior to escrow release.</p>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10">
                    <Link href="/" className="text-yellow-400 font-bold hover:underline">← Return to Marketplace</Link>
                </div>
            </div>
        </div>
    );
}
