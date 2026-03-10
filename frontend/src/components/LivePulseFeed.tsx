'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, TrendingUp, MapPin } from 'lucide-react';

const LOCATIONS = ['Mumbai', 'Dubai', 'London', 'Singapore', 'New York', 'Paris', 'Tokyo', 'Berlin'];
const ACTIONS = [
    { text: 'is watching the countdown', icon: Eye },
    { text: 'just started viewing this item', icon: Zap },
    { text: 'is eyeing the starting price', icon: Eye },
    { text: 'added this to their watchlist', icon: TrendingUp }
];

export default function LivePulseFeed() {
    const [event, setEvent] = useState<{ city: string; action: string; icon: any } | null>(null);

    useEffect(() => {
        const trigger = () => {
            const city = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
            const actionObj = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
            setEvent({ city, action: actionObj.text, icon: actionObj.icon });

            // Random delay between events
            setTimeout(() => setEvent(null), 4000);
            setTimeout(trigger, 6000 + Math.random() * 8000);
        };

        const initialDelay = setTimeout(trigger, 3000);
        return () => clearTimeout(initialDelay);
    }, []);

    return (
        <div className="h-8 relative overflow-hidden pointer-events-none">
            <AnimatePresence mode="wait">
                {event && (
                    <motion.div
                        key={event.city + event.action}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em]"
                    >
                        <div className="w-4 h-4 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                            <event.icon className="w-2.5 h-2.5 text-yellow-500" />
                        </div>
                        <span className="text-white opacity-80 flex items-center gap-1">
                            <MapPin className="w-2 h-2 text-red-500" /> {event.city}
                        </span>
                        <span className="text-gray-500">{event.action}</span>
                        <span className={`w-1 h-1 rounded-full bg-green-500 animate-pulse`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
