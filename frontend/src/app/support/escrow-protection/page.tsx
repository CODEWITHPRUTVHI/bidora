import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function SupportPage() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl prose prose-invert">
                <div className="flex items-center gap-4 mb-8">
                    <ShieldCheck className="w-12 h-12 text-yellow-500" />
                    <h1 className="text-4xl md:text-5xl font-black text-white">Escrow Protection</h1>
                </div>
                <div className="border-b border-white/10 pb-6 mb-8" />

                <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                    Our 100% Escrow Protection guarantee ensures a zero-risk transaction for both buyers and sellers.
                </p>
                <h2 className="text-2xl font-black text-white mt-12 mb-4">How It Works</h2>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                    <li><strong>Buyer Pays:</strong> Funds are deducted instantly when the auction is won.</li>
                    <li><strong>Funds Locked:</strong> The money sits securely in Bidora's third-party escrow account.</li>
                    <li><strong>Delivery & Verification:</strong> The buyer physically receives and accepts the item.</li>
                    <li><strong>Seller Paid:</strong> Funds are automatically released to the seller only after successful delivery.</li>
                </ul>
                <div className="mt-12 pt-8 border-t border-white/10">
                    <Link href="/" className="text-yellow-400 font-bold hover:underline">← Return to Marketplace</Link>
                </div>
            </div>
        </div>
    );
}
