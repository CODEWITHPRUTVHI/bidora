'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Search, ArrowLeft, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { io as ioClient, Socket } from 'socket.io-client';
import Image from 'next/image';
import Link from 'next/link';

interface Participant {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    verifiedStatus: string;
}

interface Message {
    id: string;
    senderId: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    sender: { id: string; fullName: string | null; avatarUrl: string | null };
}

interface Conversation {
    id: string;
    user1Id: string;
    user2Id: string;
    user1: Participant;
    user2: Participant;
    messages: Message[];
    unreadCount: number;
    updatedAt: string;
}

const VerifiedBadge = ({ status }: { status: string }) => {
    if (status === 'PREMIUM') return <span className="text-[9px] bg-purple-500/20 border border-purple-500/40 text-purple-400 px-1.5 py-0.5 rounded-full font-bold tracking-wider">ELITE</span>;
    if (status === 'VERIFIED') return <span className="text-[9px] bg-blue-500/20 border border-blue-500/40 text-blue-400 px-1.5 py-0.5 rounded-full font-bold tracking-wider">✓ VER</span>;
    return null;
};

const Avatar = ({ user, size = 'md' }: { user: Participant | null; size?: 'sm' | 'md' | 'lg' }) => {
    const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;
    const text = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base';
    if (!user) return <div className="w-10 h-10 rounded-full bg-white/10" />;
    if (user.avatarUrl) {
        return <Image src={user.avatarUrl} alt={user.fullName ?? ''} width={dim} height={dim} className="rounded-full object-cover flex-shrink-0" unoptimized />;
    }
    return (
        <div style={{ width: dim, height: dim }} className={`rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center font-black text-black flex-shrink-0 ${text}`}>
            {user.fullName?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
    );
};

export default function InboxMain() {
    const { user, token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const recipientId = searchParams.get('with');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Fetch all conversations on mount
    useEffect(() => {
        if (!user) { router.push('/auth'); return; }
        api.get('/messages/conversations').then(res => {
            setConversations(res.data.conversations);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user, router]);

    // Auto-open conversation if ?with= param exists
    useEffect(() => {
        if (recipientId && user) {
            api.post('/messages/conversations', { recipientId })
                .then(res => {
                    const conv = res.data.conversation;
                    setConversations(prev => {
                        if (prev.find(c => c.id === conv.id)) return prev;
                        return [{ ...conv, unreadCount: 0, messages: [] }, ...prev];
                    });
                    openConversation({ ...conv, unreadCount: 0, messages: [] });
                    setMobileView('chat');
                }).catch(console.error);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recipientId, user]);

    // Socket.io for real-time messages
    useEffect(() => {
        if (!token) return;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
        const socket = ioClient(socketUrl, { auth: { token } });
        socketRef.current = socket;

        socket.on('new_message', ({ conversationId, message }: { conversationId: string; message: Message }) => {
            setActiveConv(prev => {
                if (prev?.id === conversationId) {
                    setMessages(m => [...m, message]);
                    api.get(`/messages/conversations/${conversationId}/messages`).catch(() => {});
                    return prev;
                }
                return prev;
            });
            setConversations(prev => prev.map(c => {
                if (c.id === conversationId) {
                    return { ...c, messages: [message], updatedAt: message.createdAt, unreadCount: c.unreadCount + 1 };
                }
                return c;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        });

        return () => { socket.disconnect(); };
    }, [token]);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    const openConversation = async (conv: Conversation) => {
        setActiveConv(conv);
        setMessages([]);
        setMobileView('chat');
        try {
            const res = await api.get(`/messages/conversations/${conv.id}/messages`);
            setMessages(res.data.messages);
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
        } catch (e) { console.error(e); }
    };

    const sendMessage = async () => {
        if (!input.trim() || !activeConv || sending) return;
        setSending(true);
        const body = input.trim();
        setInput('');
        try {
            const res = await api.post(`/messages/conversations/${activeConv.id}/messages`, { body });
            setMessages(prev => [...prev, res.data.message]);
        } catch (e) { console.error(e); setInput(body); }
        finally { setSending(false); }
    };

    const getOtherUser = (conv: Conversation): Participant =>
        conv.user1Id === user?.id ? conv.user2 : conv.user1;

    const filteredConvs = conversations.filter(c =>
        (getOtherUser(c).fullName?.toLowerCase() ?? '').includes(search.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="h-[calc(100vh-65px)] flex overflow-hidden">
            {/* Conversation List */}
            <div className={`w-full md:w-[340px] lg:w-[380px] flex-shrink-0 border-r border-white/10 flex flex-col bg-black/20 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <MessageCircle className="w-6 h-6 text-yellow-400" />
                        <h1 className="text-xl font-black">Inbox</h1>
                        {conversations.reduce((a, c) => a + c.unreadCount, 0) > 0 && (
                            <span className="ml-auto bg-yellow-400 text-black text-xs font-black px-2 py-0.5 rounded-full">
                                {conversations.reduce((a, c) => a + c.unreadCount, 0)}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search conversations…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-yellow-400/50 placeholder-gray-500" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                        </div>
                    ) : filteredConvs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 p-6 text-center">
                            <MessageCircle className="w-12 h-12 text-gray-700" />
                            <p className="text-gray-500 text-sm">No conversations yet.</p>
                            <p className="text-gray-600 text-xs">Click &quot;Message Seller&quot; on any auction to start chatting!</p>
                        </div>
                    ) : filteredConvs.map(conv => {
                        const other = getOtherUser(conv);
                        const lastMsg = conv.messages[0];
                        const isActive = activeConv?.id === conv.id;
                        return (
                            <button key={conv.id} onClick={() => openConversation(conv)}
                                className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5 ${isActive ? 'bg-yellow-400/5 border-l-2 border-l-yellow-400' : ''}`}>
                                <div className="relative flex-shrink-0">
                                    <Avatar user={other} size="md" />
                                    {conv.unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-black text-[10px] font-black rounded-full flex items-center justify-center">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className={`font-semibold text-sm truncate ${conv.unreadCount > 0 ? 'text-white' : 'text-gray-300'}`}>
                                            {other.fullName ?? 'User'}
                                        </span>
                                        <span className="text-gray-600 text-[10px] flex-shrink-0">
                                            {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-300 font-semibold' : 'text-gray-500'}`}>
                                        {lastMsg ? (lastMsg.senderId === user.id ? '✓ ' : '') + lastMsg.body : 'Start the conversation…'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat Panel */}
            <div className={`flex-1 flex flex-col ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
                {!activeConv ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                        <div className="w-20 h-20 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                            <MessageCircle className="w-10 h-10 text-yellow-400" />
                        </div>
                        <h2 className="text-2xl font-black">Your Messages</h2>
                        <p className="text-gray-400 max-w-xs">Select a conversation or message a seller directly from any auction or profile page.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/20">
                            <button onClick={() => setMobileView('list')} className="md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <Link href={`/u/${getOtherUser(activeConv).id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <Avatar user={getOtherUser(activeConv)} size="md" />
                                <div>
                                    <p className="font-bold text-sm flex items-center gap-2">
                                        {getOtherUser(activeConv).fullName ?? 'User'}
                                        <VerifiedBadge status={getOtherUser(activeConv).verifiedStatus} />
                                    </p>
                                    <p className="text-gray-400 text-xs">Click to view profile</p>
                                </div>
                            </Link>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, i) => {
                                    const isMine = msg.senderId === user.id;
                                    const showAvatar = !isMine && (i === 0 || messages[i - 1].senderId !== msg.senderId);
                                    return (
                                        <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                            className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            {!isMine && (
                                                <div className="w-7 flex-shrink-0">
                                                    {showAvatar && <Avatar user={msg.sender as Participant} size="sm" />}
                                                </div>
                                            )}
                                            <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${isMine
                                                    ? 'bg-yellow-400 text-black rounded-br-sm font-medium shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                                                    : 'bg-white/10 text-white rounded-bl-sm border border-white/10'}`}>
                                                    {msg.body}
                                                </div>
                                                <div className={`flex items-center gap-1 px-1 ${isMine ? 'justify-end' : ''}`}>
                                                    <span className="text-[10px] text-gray-600">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMine && (msg.isRead
                                                        ? <CheckCheck className="w-3 h-3 text-yellow-400" />
                                                        : <Check className="w-3 h-3 text-gray-600" />)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 bg-black/20">
                            <div className="flex items-end gap-3">
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-yellow-400/50 transition-colors">
                                    <textarea rows={1} placeholder="Type a message…" value={input}
                                        onChange={e => {
                                            setInput(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                        }}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                        className="w-full bg-transparent text-white text-sm outline-none resize-none placeholder-gray-500 leading-relaxed"
                                        style={{ minHeight: '24px' }} />
                                </div>
                                <button onClick={sendMessage} disabled={sending || !input.trim()}
                                    className="w-11 h-11 bg-yellow-400 text-black rounded-full flex items-center justify-center hover:bg-yellow-300 transition-all disabled:opacity-40 disabled:scale-95 shadow-[0_0_15px_rgba(250,204,21,0.3)] flex-shrink-0">
                                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-gray-700 text-[10px] mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
