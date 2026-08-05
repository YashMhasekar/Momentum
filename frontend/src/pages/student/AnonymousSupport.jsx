import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaShieldAlt, FaLock, FaUsers, FaHeart, FaSearch,
    FaArrowRight, FaComments, FaUserSecret, FaHandHoldingHeart,
    FaStar, FaLeaf
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
    getOrCreateAnonymousUser,
    SUPPORT_ROOMS,
    getRoomStats,
} from '../../services/anonymousChatService';
import SupportRoomCard from '../../components/student/support/SupportRoomCard';
import AnonymousChat from '../../components/student/support/AnonymousChat';

const TRUST_BADGES = [
    { icon: FaLock, label: 'End-to-End Anonymous', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: FaShieldAlt, label: 'Safe & Moderated', color: 'text-teal-500', bg: 'bg-teal-50' },
    { icon: FaHeart, label: 'Judgment-Free Zone', color: 'text-pink-500', bg: 'bg-pink-50' },
    { icon: FaLeaf, label: 'Wellness-Focused', color: 'text-green-500', bg: 'bg-green-50' },
];

export default function AnonymousSupport() {
    const { currentUser } = useAuth();
    const [anonymousUser, setAnonymousUser] = useState(null);
    const [activeRoom, setActiveRoom] = useState(null);
    const [roomStats, setRoomStats] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('home'); // 'home' | 'rooms' | 'chat'

    // Initialize anonymous identity
    useEffect(() => {
        async function init() {
            if (!currentUser) return;
            const user = await getOrCreateAnonymousUser(currentUser.uid);
            setAnonymousUser(user);

            // Load room stats
            const stats = {};
            await Promise.all(
                SUPPORT_ROOMS.map(async (room) => {
                    stats[room.id] = await getRoomStats(room.id);
                })
            );
            setRoomStats(stats);
            setLoading(false);
        }
        init();
    }, [currentUser]);

    const handleJoinRoom = (room) => {
        setActiveRoom(room);
        setView('chat');
    };

    const handleBackFromChat = () => {
        setActiveRoom(null);
        setView('rooms');
    };

    const filteredRooms = SUPPORT_ROOMS.filter((room) =>
        !searchQuery ||
        room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4"
                    />
                    <p className="text-gray-500 text-sm">Setting up your anonymous identity…</p>
                </div>
            </div>
        );
    }

    // ── Chat View ──────────────────────────────────────────────────────────────
    if (view === 'chat' && activeRoom) {
        return (
            <div className="max-w-7xl mx-auto">
                <AnonymousChat
                    room={activeRoom}
                    anonymousUser={anonymousUser}
                    onBack={handleBackFromChat}
                />
            </div>
        );
    }

    // ── Rooms View ─────────────────────────────────────────────────────────────
    if (view === 'rooms') {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Support Rooms</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            You appear as <span className="font-semibold text-blue-600">{anonymousUser?.anonymousName}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setView('home')}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                    >
                        ← Back
                    </button>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                >
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search rooms by topic, tag, or keyword…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-gray-200 focus:border-blue-400 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-colors shadow-sm"
                    />
                </motion.div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredRooms.map((room, i) => (
                        <SupportRoomCard
                            key={room.id}
                            room={room}
                            stats={roomStats[room.id]}
                            onJoin={handleJoinRoom}
                            index={i}
                        />
                    ))}
                </div>

                {filteredRooms.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">No rooms match your search.</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-3 text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ── Home View ──────────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto space-y-10">

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 md:p-12 text-white shadow-2xl"
            >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                            <FaUserSecret className="text-xl" />
                        </div>
                        <span className="text-white/80 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                            Anonymous Support Space
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                        A Safe Place to Share,<br />
                        <span className="text-blue-200">Talk & Seek Support</span>
                    </h1>

                    <p className="text-white/80 text-base md:text-lg mb-8 leading-relaxed">
                        Express yourself freely without revealing your identity.
                        Connect with peers who understand, and find the support you deserve.
                    </p>

                    {/* Anonymous identity badge */}
                    <div className="flex items-center gap-3 mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 w-fit">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
                            {anonymousUser?.anonymousName?.[0] || '?'}
                        </div>
                        <div>
                            <p className="text-xs text-white/60">You appear as</p>
                            <p className="font-bold text-white">{anonymousUser?.anonymousName}</p>
                        </div>
                        <FaLock className="text-white/50 ml-2" />
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setView('rooms')}
                            className="flex items-center gap-2 px-6 py-3.5 bg-white text-indigo-700 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                        >
                            <FaComments />
                            Join Support Room
                            <FaArrowRight className="text-sm" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                                const mentalRoom = SUPPORT_ROOMS.find(r => r.id === 'mental-wellness');
                                if (mentalRoom) handleJoinRoom(mentalRoom);
                            }}
                            className="flex items-center gap-2 px-6 py-3.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-2xl border border-white/30 transition-all"
                        >
                            <FaHandHoldingHeart />
                            Start Anonymous Chat
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {TRUST_BADGES.map((badge, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.07 }}
                        className={`${badge.bg} rounded-2xl p-4 flex items-center gap-3 border border-gray-100`}
                    >
                        <badge.icon className={`text-xl ${badge.color} flex-shrink-0`} />
                        <span className="text-sm font-semibold text-gray-700">{badge.label}</span>
                    </motion.div>
                ))}
            </motion.div>

            {/* Featured Rooms */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Support Rooms</h2>
                        <p className="text-gray-500 text-sm mt-1">Choose a space that feels right for you</p>
                    </div>
                    <button
                        onClick={() => setView('rooms')}
                        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        View all <FaArrowRight className="text-xs" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {SUPPORT_ROOMS.slice(0, 4).map((room, i) => (
                        <SupportRoomCard
                            key={room.id}
                            room={room}
                            stats={roomStats[room.id]}
                            onJoin={handleJoinRoom}
                            index={i}
                        />
                    ))}
                </div>
            </motion.div>

            {/* How It Works */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 border border-gray-200"
            >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            step: '01',
                            icon: FaUserSecret,
                            title: 'Get Anonymous Identity',
                            desc: 'You\'re automatically assigned a unique anonymous name. No one can trace it back to you.',
                            color: 'from-blue-500 to-indigo-500',
                        },
                        {
                            step: '02',
                            icon: FaComments,
                            title: 'Join a Support Room',
                            desc: 'Choose a room that matches what you\'re going through. Join instantly, no approval needed.',
                            color: 'from-purple-500 to-pink-500',
                        },
                        {
                            step: '03',
                            icon: FaHeart,
                            title: 'Share & Receive Support',
                            desc: 'Talk freely, get peer support, and connect with counselors — all while staying anonymous.',
                            color: 'from-teal-500 to-green-500',
                        },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="text-center"
                        >
                            <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                                <item.icon className="text-2xl text-white" />
                            </div>
                            <div className="text-xs font-bold text-gray-400 mb-1">STEP {item.step}</div>
                            <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Privacy Promise */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm text-center"
            >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FaShieldAlt className="text-2xl text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Our Privacy Promise</h3>
                <p className="text-gray-600 max-w-xl mx-auto text-sm leading-relaxed mb-6">
                    Your real identity is never shared with other students. We use anonymous names to protect you.
                    Our moderation team monitors for safety — but only to protect you, never to expose you.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    {['No real names shown', 'No email exposed', 'Moderated for safety', 'You control your story'].map((item) => (
                        <span key={item} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                            <FaStar className="text-yellow-400 text-xs" />
                            {item}
                        </span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
