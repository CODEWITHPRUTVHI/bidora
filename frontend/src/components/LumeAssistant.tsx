'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Loader2, Info, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';

interface LumeAssistantProps {
    auctionId: string;
    onApply: (amount: number) => void;
}

const LumeAssistant: React.FC<LumeAssistantProps> = ({ auctionId, onApply }) => {
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<{ suggestedMaxBid: number; confidence: string; reasoning: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const getSuggestion = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post(`/auctions/${auctionId}/lume-suggestion`);
            setSuggestion(res.data);
        } catch (err: any) {
            console.error('Lume Error:', err);
            setError('Lume is taking a break. Try again later!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative mt-4">
            {!suggestion ? (
                <button
                    onClick={getSuggestion}
                    disabled={loading}
                    className="flex items-center gap-2 group hover:gap-3 transition-all"
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                        {loading ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-400" />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-400 transition-colors">
                        {loading ? 'Analyzing Market...' : 'Get Lume Strategy Suggestion'}
                    </span>
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Lume AI Strategy</span>
                        </div>
                        <button onClick={() => setSuggestion(null)} className="text-[10px] text-gray-500 hover:text-white font-bold">Close</button>
                    </div>

                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Recommended Max Bid</p>
                            <p className="text-2xl font-black text-white">₹{suggestion.suggestedMaxBid.toLocaleString()}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${suggestion.confidence === 'High' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                    {suggestion.confidence} Confidence
                                </span>
                                <p className="text-gray-500 text-[11px] italic leading-tight">"{suggestion.reasoning}"</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onApply(suggestion.suggestedMaxBid)}
                            className="bg-blue-500 hover:bg-blue-400 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 group"
                            title="Apply Suggestion"
                        >
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>
            )}

            {error && (
                <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-2 px-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> {error}
                </p>
            )}
        </div>
    );
};

export default LumeAssistant;
