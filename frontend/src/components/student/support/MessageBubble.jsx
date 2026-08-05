import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSmile, FaRobot, FaShieldAlt } from 'react-icons/fa';
import { addReaction } from '../../../services/anonymousChatService';

const QUICK_REACTIONS = ['❤️', '🤗', '💪', '🙏', '✨', '😊'];

const MESSAGE_STYLES = {
    support: {
        bubble: 'bg-white border border-gray-200 text-gray-800',
        label: null,
    },
    concern: {
        bubble: 'bg-amber-50 border border-amber-200 text-amber-900',
        label: { text: 'Seeking Support', color: 'text-amber-600' },
    },
    emergency: {
        bubble: 'bg-rose-50 border border-rose-200 text-rose-900',
        label: { text: 'Needs Attention', color: 'text-rose-600' },
    },
    ai: {
        bubble: 'bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200 text-teal-900',
        label: { text: 'AI Support', color: 'text-teal-600' },
    },
    system: {
        bubble: 'bg-gray-50 border border-gray-200 text-gray-500 italic text-center',
        label: null,
    },
};

function formatTime(date) {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isOwn, currentUserId, roomId }) {
    const [showReactions, setShowReactions] = useState(false);

    const style = MESSAGE_STYLES[message.messageType] || MESSAGE_STYLES.support;
    const isSystem = message.messageType === 'system';
    const isAI = message.messageType === 'ai';

    const totalReactions = Object.values(message.reactions || {}).reduce(
        (sum, users) => sum + users.length, 0
    );

    const handleReaction = async (emoji) => {
        await addReaction(roomId, message.id, emoji, currentUserId);
        setShowReactions(false);
    };

    if (isSystem) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center my-2"
            >
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {message.message}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'} group`}
        >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
                ${isAI
                    ? 'bg-gradient-to-br from-teal-500 to-blue-500'
                    : isOwn
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        : 'bg-gradient-to-br from-purple-400 to-pink-500'
                }`}
            >
                {isAI ? <FaRobot className="text-xs" /> : message.anonymousName?.[0]?.toUpperCase() || '?'}
            </div>

            <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* Name + badge */}
                <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-gray-600">
                        {isOwn ? 'You' : message.anonymousName}
                    </span>
                    {message.isVolunteer && (
                        <span className="flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">
                            <FaShieldAlt className="text-xs" />
                            {message.volunteerBadge || 'Peer Mentor'}
                        </span>
                    )}
                    {style.label && (
                        <span className={`text-xs font-medium ${style.label.color}`}>
                            · {style.label.text}
                        </span>
                    )}
                </div>

                {/* Bubble */}
                <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${style.bubble} ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.message}
                    </p>

                    {/* Reactions display */}
                    {totalReactions > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(message.reactions || {}).map(([emoji, users]) =>
                                users.length > 0 ? (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all
                                            ${users.includes(currentUserId)
                                                ? 'bg-blue-100 border-blue-300 text-blue-700'
                                                : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {emoji} {users.length}
                                    </button>
                                ) : null
                            )}
                        </div>
                    )}
                </div>

                {/* Time + reaction button */}
                <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>

                    {/* Reaction picker trigger */}
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setShowReactions(!showReactions)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <FaSmile className="text-xs" />
                        </button>

                        <AnimatePresence>
                            {showReactions && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: 4 }}
                                    className={`absolute bottom-6 ${isOwn ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-2xl shadow-xl p-2 flex gap-1.5 z-10`}
                                >
                                    {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(emoji)}
                                            className="text-lg hover:scale-125 transition-transform"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
