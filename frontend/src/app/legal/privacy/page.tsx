import Link from 'next/link';

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl text-gray-300">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">Privacy Policy</h1>
                <p className="text-sm text-gray-500 font-bold mb-8 uppercase tracking-widest">Last Updated: February 2026</p>

                <div className="space-y-6 leading-relaxed">
                    <h2 className="text-2xl font-black text-white">1. Data Collection</h2>
                    <p>We collect necessary identification data strictly for KYC and secure financial processing. Your privacy is paramount.</p>

                    <h2 className="text-2xl font-black text-white">2. Third-Party Sharing</h2>
                    <p>We do not sell user data. Verification and payment data is exclusively routed through our PCI-compliant partners like Stripe.</p>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10">
                    <Link href="/" className="text-yellow-400 font-bold hover:underline">← Return to Marketplace</Link>
                </div>
            </div>
        </div>
    );
}
