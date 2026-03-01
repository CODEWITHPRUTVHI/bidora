'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, Send, X, Bot, Loader2, Info } from 'lucide-react';
import api from '@/lib/axios';

interface AIAssistantProps {
    auctionId: string;
    auctionTitle: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ auctionId, auctionTitle }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [history, setHistory] = useState<{ type: 'user' | 'ai'; text: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const suggestedQuestions = [
        "Summarize this item",
        "Is the condition good?",
        "What are the key features?",
        "Why's the price so high/low?"
    ];

    const handleSubmit = async (e?: React.FormEvent, q?: string) => {
        if (e) e.preventDefault();
        const query = q || question;
        if (!query.trim() || loading) return;

        setHistory(prev => [...prev, { type: 'user', text: query }]);
        setQuestion('');
        setLoading(true);

        try {
            const res = await api.post(`/auctions/${auctionId}/ask-ai`, {
                question: query,
                history: history
            });
            setHistory(prev => [...prev, { type: 'ai', text: res.data.answer }]);
        } catch (error) {
            setHistory(prev => [...prev, { type: 'ai', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            {/* Toggle Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-full shadow-[0_10px_20px_-5px_rgba(79,70,229,0.5)] border border-indigo-500/30 group transition-all"
                >
                    <Sparkles className="w-4 h-4 text-yellow-300 group-hover:rotate-12 transition-transform" />
                    <span className="font-bold text-sm tracking-tight">Ask Bidora AI</span>
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col w-full max-w-md border-indigo-500/20"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border-b border-white/5 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-black text-white text-sm tracking-tight">Bidora AI Assistant</h4>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                        Powered by Gemini 1.5 <Sparkles className="w-2.5 h-2.5" />
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="h-[350px] overflow-y-auto p-6 space-y-4 scrollbar-hide text-sm">
                            {history.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="inline-block p-4 bg-indigo-500/10 rounded-3xl mb-4 border border-indigo-500/20">
                                        <MessageSquare className="w-8 h-8 text-indigo-400 opacity-50" />
                                    </div>
                                    <p className="text-gray-300 font-bold text-lg leading-tight mb-2">Ask me anything about <br /> <span className="text-indigo-400">"{auctionTitle}"</span></p>
                                    <p className="text-gray-500 text-xs px-8">I've analyzed the description and features. I can help with specs, condition, or summaries.</p>
                                </div>
                            )}

                            {history.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-5 py-3 rounded-[1.5rem] leading-relaxed shadow-sm ${msg.type === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-400/30'
                                        : 'bg-zinc-900 text-gray-200 rounded-tl-none border border-white/5'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-zinc-900 border border-white/5 px-5 py-3 rounded-[1.5rem] rounded-tl-none flex items-center gap-3">
                                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                        <span className="text-gray-400 text-xs font-medium italic">Analyzing listing details...</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Suggested Questions */}
                        {history.length === 0 && (
                            <div className="px-6 pb-2 flex flex-wrap gap-2">
                                {suggestedQuestions.map(q => (
                                    <button
                                        key={q}
                                        onClick={() => handleSubmit(undefined, q)}
                                        className="text-[11px] font-bold text-gray-400 bg-white/5 border border-white/10 px-3 py-2 rounded-xl hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-400 transition-all active:scale-95"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-6 pt-2 border-t border-white/5">
                            <form onSubmit={handleSubmit} className="relative">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Type your question..."
                                    className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all placeholder:text-gray-600"
                                />
                                <button
                                    type="submit"
                                    disabled={!question.trim() || loading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-all disabled:opacity-50 active:scale-90 shadow-lg shadow-indigo-600/20"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="mt-3 text-[9px] text-gray-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 grayscale opacity-50">
                                <Info className="w-3 h-3" /> AI can make mistakes. Check facts.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AIAssistant;
