import Link from 'next/link';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl prose prose-invert">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">Seller Verification Protocol</h1>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                    To maintain strict control over authenticity, Bidora requires all sellers to undergo a rigid KYC and trust-check process.
                </p>
                <h2 className="text-2xl font-black text-white mt-12 mb-4">How to Get Verified</h2>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                    <li>Submit government-issued ID.</li>
                    <li>Provide proof of asset ownership.</li>
                    <li>Maintain a minimum trust score through successful delivery histories.</li>
                </ul>
                <div className="mt-12 pt-8 border-t border-white/10">
                    <Link href="/" className="text-yellow-400 font-bold hover:underline">← Return to Marketplace</Link>
                </div>
            </div>
        </div>
    );
}
