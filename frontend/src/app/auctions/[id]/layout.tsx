import { Metadata, ResolvingMetadata } from 'next';

type Props = {
    params: Promise<{ id: string }>;
    children: React.ReactNode;
};

async function getAuction(id: string) {
    // In server components, fetch via API with no-store or revalidate
    // We are running on the server, we use the local API if possible or just fetch the live domain if configured
    try {
        const fetchUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auctions/${id}`;
        const res = await fetch(fetchUrl, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return res.json();
    } catch (e) {
        return null;
    }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;
    const auction = await getAuction(id);

    if (!auction) {
        return {
            title: 'Auction Not Found - Bidora',
            description: 'This sneaker auction could not be found.',
        };
    }

    const title = `${auction.title} | Bidora Live Auction`;
    const description = `Bid now on ${auction.title}. Current bid: ₹${auction.currentHighestBid || auction.startingPrice}. ${auction.description?.substring(0, 100)}... Verify and Win on Bidora India.`;
    const imageUrl = auction.imageUrls?.[0] || 'https://bidora.me/apple-touch-icon.png';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://bidora.me/auctions/${id}`,
            siteName: 'Bidora - India\'s Sneaker Auction Platform',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: 'website',
            locale: 'en_IN',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    };
}

export default function AuctionLayout({ children }: Props) {
    return <>{children}</>;
}
