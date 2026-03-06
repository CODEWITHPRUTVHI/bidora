'use client';

import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceBiddingProps {
    minBid: number;
    currentBid: number;
    onRecognizedBid: (amount: number) => void;
}

export default function VoiceBidding({ minBid, currentBid, onRecognizedBid }: VoiceBiddingProps) {
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (listening) {
            setIsListening(true);
            setFeedback({ text: 'Listening... say "Bid 5000"', type: 'info' });
        } else {
            setIsListening(false);
            if (!feedback || feedback.type === 'info') {
                setFeedback(null);
            }
        }
    }, [listening]);

    useEffect(() => {
        if (!transcript) return;

        // Try to find a command pattern like "bid 5000" or just a number if they are in the context of bidding
        const lowerTranscript = transcript.toLowerCase();

        // Match numbers, removing commas (e.g., "5,000" -> "5000")
        const numberMatch = lowerTranscript.replace(/,/g, '').match(/\d+/);

        if (lowerTranscript.includes('bid') && numberMatch) {
            const spokenAmount = parseInt(numberMatch[0], 10);

            if (spokenAmount >= minBid) {
                setFeedback({ text: `Recognized: ₹${spokenAmount.toLocaleString()}`, type: 'success' });
                SpeechRecognition.stopListening();
                // Trigger the callback
                onRecognizedBid(spokenAmount);
            } else {
                setFeedback({ text: `Amount too low. Min is ₹${minBid.toLocaleString()}`, type: 'error' });
                // Reset to try again
                setTimeout(resetTranscript, 2000);
            }
        } else if (numberMatch && lowerTranscript.length < 15) {
            // They just said a number maybe
            const spokenAmount = parseInt(numberMatch[0], 10);
            if (spokenAmount >= minBid) {
                setFeedback({ text: `Did you mean to bid ₹${spokenAmount.toLocaleString()}?`, type: 'info' });
            }
        }

    }, [transcript, minBid, onRecognizedBid]);


    const toggleListening = () => {
        if (!browserSupportsSpeechRecognition) {
            setFeedback({ text: "Browser doesn't support speech recognition.", type: 'error' });
            return;
        }

        if (isListening) {
            SpeechRecognition.stopListening();
        } else {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
        }
    };

    if (!browserSupportsSpeechRecognition) return null; // Hide completely if not supported

    return (
        <div className="relative isolate mt-6 mb-2 flex flex-col items-center">

            {/* Visualizer Ring */}
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.5 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
                        className="absolute w-20 h-20 bg-blue-500/20 rounded-full -z-10"
                    />
                )}
            </AnimatePresence>


            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleListening}
                className={`flex flex-col items-center justify-center p-4 rounded-full transition-all border-2 shadow-lg ${isListening
                        ? 'bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] border-blue-500 text-blue-400'
                        : 'bg-zinc-800 border-white/10 hover:border-blue-500/50 text-gray-400 hover:text-white'
                    }`}
            >
                {isListening ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mic className="w-6 h-6" />}
            </motion.button>

            <p className="text-[10px] font-black uppercase tracking-widest mt-3 text-gray-500">
                {isListening ? 'Voice Active' : 'Voice Bid'}
            </p>

            <AnimatePresence mode="wait">
                {feedback && (
                    <motion.div
                        key={feedback.text}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mt-3 text-[11px] font-bold tracking-wider px-3 py-1.5 rounded-lg border ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                feedback.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}
                    >
                        {feedback.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {transcript && isListening && !feedback?.text.includes('Amount too low') && (
                <p className="mt-2 text-xs italic text-gray-400 max-w-[200px] text-center truncate">"{transcript}"</p>
            )}

        </div>
    );
}
