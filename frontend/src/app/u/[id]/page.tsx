'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    BadgeCheck,
    Trophy,
    TrendingUp,
    Star,
    ArrowLeft,
    Clock,
    UserCheck,
    UserPlus,
    Package,
    XCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuth } from '@/store/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const userId = params.id as string;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/social/profile/${userId}`);
            setProfile(res.data.profile);
            setIsFollowing(res.data.profile.isFollowing);
        } catch (err: any) {
            console.error('Failed to fetch profile', err);
            setError(err.response?.data?.error || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const toggleFollow = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setFollowLoading(true);
        try {
            if (isFollowing) {
                await api.delete(`/social/unfollow/${userId}`);
                setIsFollowing(false);
                setProfile((prev: any) => ({
                    ...prev,
                    _count: { ...prev._count, followers: prev._count.followers - 1 }
                }));
            } else {
                await api.post(`/social/follow/${userId}`);
                setIsFollowing(true);
                setProfile((prev: any) => ({
                    ...prev,
                    _count: { ...prev._count, followers: prev._count.followers + 1 }
                }));
            }
        } catch (error) {
            console.error('Follow action failed:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white p-6 pt-32">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-48 w-full rounded-3xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-96 rounded-3xl md:col-span-1" />
                        <Skeleton className="h-96 rounded-3xl md:col-span-2" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-black text-white p-6 pt-32 flex flex-col items-center justify-center">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-black mb-2">Profile Not Found</h1>
                <p className="text-gray-400 mb-6">{error || "This user doesn't exist or was removed."}</p>
                <Link href="/" className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Return Home
                </Link>
            </div>
        );
    }

    const unoptimizedImage = (profile.avatarUrl && profile.avatarUrl.includes('googleusercontent.com')) ? true : false;
    const isOwnProfile = currentUser?.id === profile.id;

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header Banner */}
            <div className="h-48 md:h-64 bg-zinc-900 border-b border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black pointer-events-none"></div>
                <button onClick={() => router.back()} className="absolute top-24 left-6 z-10 p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ── LEFT COLUMN: Profile Info ──────────────── */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Avatar & Basics */}
                        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center shadow-2xl">
                            <div className="relative w-32 h-32 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-black bg-zinc-800 overflow-hidden z-10">
                                    {profile.avatarUrl ? (
                                        <Image src={profile.avatarUrl} alt={profile.fullName} fill className="object-cover" unoptimized={unoptimizedImage} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-5xl">👤</div>
                                    )}
                                </div>
                                {profile.verifiedStatus !== 'BASIC' && (
                                    <div className="absolute bottom-0 right-0 z-20 bg-black rounded-full p-1 border-2 border-black">
                                        <BadgeCheck className={`w-8 h-8 ${profile.verifiedStatus === 'PREMIUM' ? 'text-yellow-400' : 'text-blue-400'}`} />
                                    </div>
                                )}
                            </div>

                            <h1 className="text-2xl font-black text-white mb-1 flex items-center justify-center gap-2">
                                {profile.fullName}
                            </h1>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-1.5">
                                <Clock className="w-3 h-3" /> Joined {new Date(profile.createdAt).getFullYear()}
                            </p>

                            {profile.collectorBadge && profile.collectorBadge !== 'NOVICE' && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-xs font-black tracking-widest mb-6 uppercase">
                                    <Trophy className="w-3.5 h-3.5" /> {profile.collectorBadge} Collector
                                </div>
                            )}

                            {/* Trust Score */}
                            <div className="bg-black/50 border border-white/5 rounded-2xl p-4 mb-6">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-400 font-bold">Trust Score</span>
                                    <span className="flex items-center gap-1 text-white font-black">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        {profile.trustScore}
                                    </span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
                                    <div className="bg-gradient-to-r from-yellow-500 to-green-500 h-1.5 rounded-full" style={{ width: `${(profile.trustScore / 5) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Followers</p>
                                    <p className="text-xl font-black text-white">{profile._count.followers}</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Following</p>
                                    <p className="text-xl font-black text-white">{profile._count.following}</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Active Items</p>
                                    <p className="text-xl font-black text-white">{profile._count.auctionsAsSeller}</p>
                                </div>
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Items Sold</p>
                                    <p className="text-xl font-black text-white">{profile._count.escrowAsSeller}</p>
                                </div>
                            </div>

                            {!isOwnProfile && (
                                <button
                                    onClick={toggleFollow}
                                    disabled={followLoading}
                                    className={`w-full py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all ${isFollowing
                                        ? 'bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10'
                                        : 'bg-white text-black hover:bg-gray-200'
                                        }`}
                                >
                                    {followLoading ? (
                                        <span className="animate-pulse">Loading...</span>
                                    ) : isFollowing ? (
                                        <>
                                            <UserCheck className="w-4 h-4" /> Following
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" /> Follow Seller
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: Activity & Listings ──────── */}
                    <div className="lg:col-span-2 space-y-6 pt-4 lg:pt-0">
                        {/* Active Listings */}
                        <div>
                            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-yellow-500" /> Active Listings
                            </h2>
                            {profile.activeListings && profile.activeListings.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {profile.activeListings.map((auction: any) => (
                                        <Link href={`/auctions/${auction.id}`} key={auction.id}>
                                            <div className="bg-zinc-900/40 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 hover:bg-zinc-800/60 transition-all group">
                                                <div className="relative h-40 w-full bg-zinc-800">
                                                    {auction.imageUrls?.[0] ? (
                                                        <Image src={auction.imageUrls[0]} alt={auction.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-600"><Package className="w-8 h-8" /></div>
                                                    )}
                                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-xs font-bold px-2 py-1 rounded border border-white/10">
                                                        {auction._count.bids} Bids
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <h3 className="font-bold text-white mb-1 truncate">{auction.title}</h3>
                                                    <div className="flex justify-between items-end">
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Bid</p>
                                                            <p className="text-lg font-black text-yellow-400">₹{Number(auction.currentHighestBid).toLocaleString()}</p>
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-mono">
                                                            {new Date(auction.endTime) < new Date() ? 'Ended' : `${Math.floor((new Date(auction.endTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 text-center">
                                    <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium">No active listings right now.</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Drops / Sales */}
                        <div className="pt-6">
                            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" /> Recent Sales Archive
                            </h2>
                            {profile.recentSales && profile.recentSales.length > 0 ? (
                                <div className="space-y-3">
                                    {profile.recentSales.map((sale: any) => (
                                        <div key={sale.id} className="bg-gradient-to-r from-zinc-900/60 to-transparent border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                            <div className="relative w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
                                                {sale.auction.imageUrls?.[0] ? (
                                                    <Image src={sale.auction.imageUrls[0]} alt="" fill className="object-cover" />
                                                ) : (
                                                    <Package className="w-full h-full p-3 text-gray-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white truncate">{sale.auction.title}</p>
                                                <p className="text-xs text-gray-500">{new Date(sale.releasedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-green-500 font-bold uppercase tracking-wider mb-0.5">Sold For</p>
                                                <p className="text-lg font-black text-white">₹{Number(sale.amount).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 text-center">
                                    <p className="text-gray-400 font-medium">No archived sales found.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
