import Link from 'next/link';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl text-gray-300">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">Terms of Service</h1>
                <p className="text-sm text-gray-500 font-bold mb-8 uppercase tracking-widest">Last Updated: March 05, 2026</p>

                <div className="space-y-8 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">1. Agreement to Terms</h2>
                        <p>By accessing or using Bidora ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the Platform. Bidora is a real-time auction marketplace facilitating transactions between independent buyers and sellers.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">2. Eligibility & Account Security</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>You must be at least 18 years of age to create an account.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>Bidding requires a verified account and may require a minimum wallet balance.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">3. Bidding & Auction Rules</h2>
                        <p className="mb-4"><strong className="text-yellow-400">Every bid is a legally binding contract.</strong> If you are the winning bidder, you are legally obligated to complete the purchase.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Bid Increments:</strong> Bids must follow the increment rules specified for each auction.</li>
                            <li><strong>Sniping Protection:</strong> Bids placed in the final seconds of an auction may trigger a "Time Extension" to ensure all participants have a fair chance to respond.</li>
                            <li><strong>Retractions:</strong> Bids cannot be retracted once placed. Please review your bid amount carefully.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">4. Payments & Escrow</h2>
                        <p>Bidora utilizes an escrow system to protect both parties. When an auction is won:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>The Buyer must complete payment within 48 hours.</li>
                            <li>Funds are held securely by Bidora or its payment partners until the item is delivered and confirmed.</li>
                            <li><strong>Platform Fee:</strong> Bidora deducts a service fee (typically 7%) from the final sale price before releasing funds to the Seller.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">5. Seller Obligations</h2>
                        <p>Sellers represent that they have legal title to the items being auctioned. Sellers must ship items within 5 business days of payment confirmation and provide valid tracking information through the Platform.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">6. Prohibited Behavior</h2>
                        <p>Users are strictly prohibited from:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Shill Bidding:</strong> Bidding on your own items or having associates bid to artificially inflate the price.</li>
                            <li><strong>Off-Platform Trading:</strong> Circumventing Bidora's fees by completing transactions outside the Platform.</li>
                            <li><strong>Fraudulent Listings:</strong> Listing items you do not own or misrepresenting item condition.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">7. Disputes & Returns</h2>
                        <p>If an item is not as described, Buyers may open a dispute within 48 hours of delivery. Bidora's arbitration team will review evidence from both parties. Decisions made by the arbitration team are final regarding the release or refund of escrowed funds.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">8. Limitation of Liability</h2>
                        <p>Bidora is not responsible for the accurately or condition of items listed by independent sellers. We provide the technical platform for auctions but do not take physical possession of items.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">9. Contact Information</h2>
                        <p>For legal inquiries or support, please contact <span className="text-white font-bold">legal@bidora.me</span>.</p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10">
                    <Link href="/" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-yellow-400 font-bold hover:bg-white/10 transition-all inline-block">
                        ← Return to Marketplace
                    </Link>
                </div>
            </div>
        </div>
    );
}
