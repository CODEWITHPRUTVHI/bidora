import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import Schema from '@/components/seo/Schema';


// Placeholder blog data for SEO ranking
const POSTS = [
    {
        id: 1,
        title: "Top 10 Rarest Sneakers You Can Buy in India Right Now",
        slug: "rare-sneakers-india-top-10",
        category: "Market Intel",
        date: "March 8, 2026",
        excerpt: "Searching for rare sneakers India? We've curated the ultimate list of the top 10 most exclusive kicks currently available on the Indian secondary market.",
        image: "https://images.unsplash.com/photo-1552346154-21d32810baa3?w=800&q=80"
    },
    {
        id: 2,
        title: "How to Sell Sneakers Online in India and Actually Make Money",
        slug: "how-to-sell-sneakers-online-india",
        category: "Seller Guide",
        date: "March 8, 2026",
        excerpt: "Learn how to sell sneakers India like a pro. From photography tips to using escrow-secured platforms, here is your roadmap to profit.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"
    },
    {
        id: 3,
        title: "Air Jordan 1 Price Guide India 2026 — How Much Should You Pay?",
        slug: "air-jordan-1-price-guide-india-2026",
        category: "Price Guide",
        date: "March 8, 2026",
        excerpt: "Check the latest Air Jordan 1 price India before you bid. Real-time market estimates for the most iconic silhouette in history.",
        image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80"
    },
    {
        id: 4,
        title: "StockX India Alternative — Why Indian Sneakerheads are Switching to Bidora",
        slug: "stockx-india-alternative-bidora",
        category: "Market Intel",
        date: "March 8, 2026",
        excerpt: "Tired of customs duties and international fees? See why Bidora is the definitive StockX India alternative for local collectors.",
        image: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&q=80"
    },
    {
        id: 5,
        title: "Sneaker Authentication India: How Bidora Verifies Every Pair",
        slug: "sneaker-authentication-india-guide",
        category: "Safety",
        date: "March 8, 2026",
        excerpt: "In a market flooded with high-quality replicas, sneaker authentication India is essential. See how our 6-point verification process protects you.",
        image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80"
    },
    {
        id: 6,
        title: "Safe Sneaker Buying India: Why Escrow is a Game Changer",
        slug: "safe-sneaker-buying-india-escrow",
        category: "Guides",
        date: "March 8, 2026",
        excerpt: "Scams are common on Instagram. Learn how Bidora Escrow ensures safe sneaker buying India for every transaction.",
        image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80"
    },
    {
        id: 7,
        title: "The Rise of Indian Sneaker Culture: From Niche to Mainstream",
        slug: "indian-sneaker-culture-mumbai-delhi",
        category: "Community",
        date: "March 8, 2026",
        excerpt: "From Mumbai street style to Delhi high-heat flexes, explore the evolution and impact of Indian sneaker culture.",
        image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80"
    },
    {
        id: 8,
        title: "Top 5 Upcoming Sneaker Drops in India (April/May 2026)",
        slug: "upcoming-sneaker-drops-india-2026",
        category: "Upcoming",
        date: "March 8, 2026",
        excerpt: "From Travis Scotts to the Reverse Panda 2.0, these are the upcoming sneaker drops India collectors are waiting for.",
        image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80"
    }
];

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20 relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[150px] -z-10 rounded-full" />

            <div className="container mx-auto px-6 max-w-6xl">
                <Breadcrumbs
                    items={[
                        { label: 'Journal', href: '/blog' }
                    ]}
                />

                <div className="text-center mb-16">
                    <p className="text-yellow-400 text-sm font-black uppercase tracking-widest mb-4">The Bidora Journal</p>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-6">
                        Insights, Guides & <br /> Market News.
                    </h1>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {POSTS.map(post => (
                        <div key={post.id} className="bg-zinc-900/60 border border-white/10 rounded-3xl overflow-hidden hover:border-yellow-400/40 transition-all group flex flex-col shadow-xl">
                            <div className="aspect-[4/3] overflow-hidden relative">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 bg-yellow-400 text-black text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg shadow-lg">
                                    {post.category}
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-grow">
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 flex items-center">
                                    <FileText className="w-3 h-3 mr-2" /> {post.date}
                                </p>
                                <h2 className="text-2xl font-black text-white mb-4 leading-tight group-hover:text-yellow-400 transition-colors">
                                    {post.title}
                                </h2>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                                    {post.excerpt}
                                </p>
                                <Link href={`/blog/${post.slug}`} className="text-yellow-400 font-black text-sm uppercase tracking-widest flex items-center group-hover:underline w-fit">
                                    Read Article <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
