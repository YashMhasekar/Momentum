import React from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaArrowRight, FaShieldAlt } from 'react-icons/fa';

export default function SupportRoomCard({ room, stats, onJoin, index }) {
    const participantCount = stats?.activeParticipants ?? Math.floor(Math.random() * 12) + 2;

    const supportLevelColor = {
        'Peer Support': 'bg-blue-100 text-blue-700',
        'Peer + Counselor': 'bg-purple-100 text-purple-700',
        'Counselor Available': 'bg-teal-100 text-teal-700',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className={`relative bg-white rounded-2xl border ${room.borderColor} shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer group`}
            onClick={() => onJoin(room)}
        >
            {/* Top gradient strip */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${room.color}`} />

            <div className="p-6">
                {/* Icon + Title */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${room.bgColor} flex items-center justify-center text-2xl`}>
                            {room.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-base leading-tight">{room.title}</h3>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${supportLevelColor[room.supportLevel] || 'bg-gray-100 text-gray-600'}`}>
                                <FaShieldAlt className="inline mr-1 text-xs" />
                                {room.supportLevel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    {room.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {room.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <div className="flex -space-x-1">
                            {[...Array(Math.min(3, participantCount))].map((_, i) => (
                                <div key={i} className={`w-5 h-5 rounded-full bg-gradient-to-br ${room.color} border-2 border-white`} />
                            ))}
                        </div>
                        <span className="font-medium text-gray-700">{participantCount}</span>
                        <span>active</span>
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse ml-1" />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${room.color} text-white text-sm font-semibold rounded-xl shadow-md group-hover:shadow-lg transition-all`}
                        onClick={(e) => { e.stopPropagation(); onJoin(room); }}
                    >
                        Join
                        <FaArrowRight className="text-xs" />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
