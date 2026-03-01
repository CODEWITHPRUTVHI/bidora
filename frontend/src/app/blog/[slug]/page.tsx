import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const POSTS: Record<string, any> = {
    "how-to-spot-fake-rolex": {
        title: "How to Spot a Fake Rolex: The Ultimate 2026 Guide",
        category: "Luxury Watches",
        date: "Feb 28, 2026",
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=80",
        content: `
            <p>Rolex watches are among the most counterfeited items in the world. As counterfeiting technology improves, spotting a fake requires a trained eye. At Bidora, our verification experts look for several key indicators before approving any luxury timepiece for auction.</p>
            
            <h3>1. The Weight and Metal Quality</h3>
            <p>A genuine Rolex is carved from solid blocks of 904L steel (Oystersteel), 18ct gold, or platinum. This gives it a significant, substantial weight. Fakes are often hollow or use cheaper, lighter steel alloys.</p>

            <h3>2. The Cyclops Magnification</h3>
            <p>On models with a date window, the "Cyclops" lens magnifying the date should magnify it exactly 2.5 times, making it take up the entire window. Counterfeits often have weak magnification or misaligned lenses.</p>

            <h3>3. The Movement and Tick</h3>
            <p>Rolex movements are legendary for their smooth sweep. They tick at 28,800 vibrations per hour (8 ticks per second), creating a sweeping motion. If you hear a loud, distinct "tick-tock" or see the second hand jerking sharply, it's almost certainly a fake.</p>

            <p><strong>Note:</strong> When you buy on Bidora, these checks are done for you. Our strict escrow and verification protocols ensure you never inadvertently bid on a counterfeit item.</p>
        `
    },
    "why-escrow-future-online-auctions": {
        title: "Why Escrow is the Future of High-Value Online Auctions",
        category: "Platform Updates",
        date: "Feb 20, 2026",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80",
        content: `
            <p>The traditional online auction model is fundamentally flawed. Buyers bid on items without the guarantee of delivery, and sellers accept bids from users who may not have the funds. Bidora was created to fix this trust deficit.</p>

            <h3>The Double-Sided Risk</h3>
            <p>In a standard marketplace, high-value transactions are stressful. Who sends first? The money or the item? Scams are prevalent, and platforms often wash their hands of disputes once the transaction moves off-site.</p>

            <h3>The Escrow Solution</h3>
            <p>Bidora integrates smart escrow directly into the bidding process. You cannot place a bid unless your Bidora wallet has the funds. When you win, the funds are instantly moved to a secure, neutral escrow account.</p>
            <p>The seller is then notified to ship. They know the money is guaranteed. The funds are only released to the seller once the buyer receives and verifies the item. It is a perfectly balanced system where neither party takes on risk.</p>
            <p>We believe this is the only logical way forward for luxury e-commerce.</p>
        `
    },
    "top-10-anticipated-sneaker-drops": {
        title: "Top 10 Most Anticipated Sneaker Drops Reselling This Spring",
        category: "Rare Collectibles",
        date: "Feb 15, 2026",
        image: "https://images.unsplash.com/photo-1552346154-21d32810baa3?w=1200&q=80",
        content: `
            <p>Spring 2026 is shaping up to be an absolute blockbuster season for sneakerheads. From ultra-limited collaborations to the revival of classic retros, the secondary market is bracing for massive volatility. Here’s what we are tracking at Bidora.</p>

            <h3>1. The Travis Scott Air Jordan 4 "Cactus Jack V2"</h3>
            <p>Rumors have been swirling for months, and it’s finally confirmed. The V2 brings a darker mocha hue and reversed swooshes. Expect live auction prices to surge immediately upon release.</p>

            <h3>2. Off-White x Nike Dunk Low "Archive Collection"</h3>
            <p>Celebrating the late Virgil Abloh’s legacy, Nike is releasing a strictly limited run of unreleased Dunk Low prototypes. These will be highly sought after by serious archivists and collectors.</p>

            <h3>3. Asics Gel-Kayano 14 x JJJJound</h3>
            <p>Moving away from the hyper-hype of Nike, JJJJound’s minimalist take on the tech-runner aesthetic continues to command premium prices. The muted silver and olive colorway is already generating massive pre-release buzz.</p>

            <p>Keep your Bidora wallets loaded—these items will be hitting our live auction blocks over the coming weeks.</p>
        `
    }
};

export default function BlogPost({ params }: { params: { slug: string } }) {
    const post = POSTS[params.slug];

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-zinc-950 pt-32 pb-20 relative">
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-yellow-500/5 blur-[150px] -z-10 rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 max-w-4xl">

                <Link href="/blog" className="inline-flex items-center text-gray-500 hover:text-white font-bold transition-colors mb-8 group bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Journal
                </Link>

                <div className="mb-12">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-4 flex items-center">
                        <span className="text-yellow-400 mr-4 bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/20">{post.category}</span>
                        <FileText className="w-4 h-4 mr-2" /> {post.date}
                    </p>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight drop-shadow-sm">
                        {post.title}
                    </h1>
                </div>

                <div className="aspect-[21/9] w-full bg-zinc-900 rounded-[2.5rem] overflow-hidden mb-12 border border-white/10 shadow-2xl">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>

                <div
                    className="prose prose-invert prose-lg max-w-none prose-h3:text-white prose-h3:font-black prose-h3:text-3xl prose-h3:mt-12 prose-a:text-yellow-400 prose-p:text-gray-300 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                <div className="mt-20 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-4 border border-white/20">
                            👤
                        </div>
                        <div>
                            <p className="text-white font-black">Bidora Editorial Team</p>
                            <p className="text-gray-500 text-sm">Market Insights & Guides</p>
                        </div>
                    </div>
                    <Link href="/search" className="px-8 py-3 bg-yellow-400 text-black font-black uppercase tracking-widest text-sm rounded-xl hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                        Browse Auctions
                    </Link>
                </div>

            </div>
        </div>
    );
}
