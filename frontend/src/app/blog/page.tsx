import { ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';

// Placeholder blog data for SEO ranking
const POSTS = [
    {
        id: 1,
        title: "How to Spot a Fake Rolex: The Ultimate 2026 Guide",
        slug: "how-to-spot-fake-rolex",
        category: "Luxury Watches",
        date: "Feb 28, 2026",
        excerpt: "The ultimate guide to authenticating luxury timepieces before you place a bid. Learn the hidden details that counterfeiters always miss.",
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80"
    },
    {
        id: 2,
        title: "Why Escrow is the Future of High-Value Online Auctions",
        slug: "why-escrow-future-online-auctions",
        category: "Platform Updates",
        date: "Feb 20, 2026",
        excerpt: "Bidora CEO Pruthviraj Chavan explains why the traditional auction model is broken, and how smart-escrow contracts guarantee 100% secure transactions.",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
    },
    {
        id: 3,
        title: "Top 10 Most Anticipated Sneaker Drops Reselling This Spring",
        slug: "top-10-anticipated-sneaker-drops",
        category: "Rare Collectibles",
        date: "Feb 15, 2026",
        excerpt: "From limited Nike collaborations to exclusive Yeezy releases, here are the top 10 sneakers hitting the Bidora live auction block this season.",
        image: "https://images.unsplash.com/photo-1552346154-21d32810baa3?w=800&q=80"
    }
];

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20 relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 blur-[150px] -z-10 rounded-full" />

            <div className="container mx-auto px-6 max-w-6xl">

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
