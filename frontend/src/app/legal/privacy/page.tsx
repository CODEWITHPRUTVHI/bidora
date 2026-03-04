import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl text-gray-300">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-8 border-b border-white/10 pb-6">Privacy Policy</h1>
                <p className="text-sm text-gray-500 font-bold mb-8 uppercase tracking-widest">Last Updated: March 05, 2026</p>

                <div className="space-y-8 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">1. Information We Collect</h2>
                        <p className="mb-4">To provide a secure auction experience, we collect the following information:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Account Data:</strong> Name, email address, phone number, and password.</li>
                            <li><strong>Verification Data:</strong> For sellers, we may collect government-issued IDs, tax identifiers (PAN), or business registration documents to verify authenticity.</li>
                            <li><strong>Transaction Data:</strong> Details of bids, purchases, and wallet transactions.</li>
                            <li><strong>Technical Data:</strong> IP address, browser type, and device information to prevent fraud and multi-account abuse.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">2. How We Use Your Information</h2>
                        <p className="mb-2">Your data is used specifically for:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Facilitating real-time bidding and auction notifications.</li>
                            <li>Processing payments and managing your wallet balance.</li>
                            <li>Shipping coordination (sharing your address with the seller after payment).</li>
                            <li>Fraud detection and automated risk assessment (Trust Score system).</li>
                            <li>Customer support and dispute resolution.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">3. Data Sharing</h2>
                        <p className="mb-2">We do not sell your personal data. Sharing only occurs in these scenarios:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>With Other Users:</strong> When you win an auction, your shipping details are shared with the seller. When you bid, your public profile name may be visible.</li>
                            <li><strong>Service Providers:</strong> Payment processors (Cashfree), Logistics partners (Shippo), and Infrastructure providers (Vercel/Railway).</li>
                            <li><strong>Legal Requirements:</strong> If required by law or to protect the safety of our users and platform.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">4. Data Security</h2>
                        <p>We implement industry-standard security measures including SSL/TLS encryption for all data in transit, password hashing (Bcrypt), and secure database protocols. However, no method of transmission over the Internet is 100% secure.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">5. Your Privacy Rights</h2>
                        <p>You have the right to access, correct, or request the deletion of your personal data. You may also opt-out of marketing communications at any time. To exercise these rights, please contact our support team.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">6. Cookies</h2>
                        <p>We use cookies to maintain your session and remember your preferences. You can disable cookies in your browser settings, but some features of Bidora may not function correctly.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">7. Changes to This Policy</h2>
                        <p>We may update this policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4">8. Contact Us</h2>
                        <p>If you have questions about this Privacy Policy, please email us at <span className="text-white font-bold">privacy@bidora.me</span>.</p>
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
