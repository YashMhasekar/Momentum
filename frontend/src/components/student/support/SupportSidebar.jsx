import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock, FaEye, FaEyeSlash, FaHeart, FaUsers, FaCalendarCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function SupportSidebar({ room, anonymousName, participantCount }) {
    const navigate = useNavigate();

    const guidelines = [
        'Be kind and supportive to everyone',
        'No personal attacks or judgment',
        'Respect everyone\'s privacy',
        'Share only what you\'re comfortable with',
        'Report harmful content immediately',
    ];

    return (
        <div className="space-y-4">
            {/* Your Identity */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4"
            >
                <div className="flex items-center gap-2 mb-3">
                    <FaEyeSlash className="text-blue-500" />
                    <h3 className="font-bold text-blue-900 text-sm">Your Anonymous Identity</h3>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {anonymousName?.[0] || '?'}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">{anonymousName}</p>
                        <p className="text-xs text-gray-500">Visible to others in this room</p>
                    </div>
                </div>
                <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
                    <FaLock className="text-xs" />
                    Your real identity is always hidden
                </p>
            </motion.div>

            {/* Room Info */}
            {room && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`${room.bgColor} border ${room.borderColor} rounded-2xl p-4`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{room.icon}</span>
                        <h3 className="font-bold text-gray-900 text-sm">{room.title}</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{room.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FaUsers className="text-gray-400" />
                        <span><strong>{participantCount}</strong> people in this room</span>
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    </div>
                </motion.div>
            )}

            {/* Community Guidelines */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-2xl p-4"
            >
                <div className="flex items-center gap-2 mb-3">
                    <FaShieldAlt className="text-teal-500" />
                    <h3 className="font-bold text-gray-900 text-sm">Community Guidelines</h3>
                </div>
                <ul className="space-y-2">
                    {guidelines.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="text-teal-500 mt-0.5 font-bold">✓</span>
                            {g}
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Need More Help */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4"
            >
                <div className="flex items-center gap-2 mb-3">
                    <FaHeart className="text-pink-500" />
                    <h3 className="font-bold text-gray-900 text-sm">Need More Support?</h3>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                    Connect with a certified counselor for private, one-on-one support.
                </p>
                <button
                    onClick={() => navigate('/student/counselor')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs font-semibold rounded-xl transition-all shadow-md"
                >
                    <FaCalendarCheck />
                    Book a Counselor Session
                </button>
            </motion.div>
        </div>
    );
}
