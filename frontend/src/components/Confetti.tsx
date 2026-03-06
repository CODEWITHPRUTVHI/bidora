'use client';
import React from 'react';
import { motion } from 'framer-motion';

export default function Confetti() {
    const pieces = Array.from({ length: 50 });
    const colors = ['#facc15', '#3b82f6', '#10b981', '#ef4444', '#ffffff'];

    return (
        <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
            {pieces.map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        top: -20,
                        left: `${Math.random() * 100}%`,
                        opacity: 1,
                        scale: Math.random() * 0.5 + 0.5,
                        rotate: 0
                    }}
                    animate={{
                        top: '120%',
                        left: `${(Math.random() * 100) + (Math.random() * 20 - 10)}%`,
                        rotate: 720,
                        opacity: 0
                    }}
                    transition={{
                        duration: Math.random() * 2 + 2,
                        ease: "easeOut",
                        delay: Math.random() * 0.5
                    }}
                    style={{
                        position: 'absolute',
                        width: Math.random() * 10 + 5,
                        height: Math.random() * 10 + 5,
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                    }}
                />
            ))}
        </div>
    );
}
