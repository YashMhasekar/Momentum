import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TypingIndicator({ typers }) {
    if (!typers || typers.length === 0) return null;

    const label =
        typers.length === 1
            ? `${typers[0]} is typing`
            : typers.length === 2
                ? `${typers[0]} and ${typers[1]} are typing`
                : `${typers.length} people are typing`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-2 px-2"
            >
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500 ml-1">{label}…</span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
