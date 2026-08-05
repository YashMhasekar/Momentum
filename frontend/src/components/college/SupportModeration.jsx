import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaShieldAlt, FaExclamationTriangle, FaCheckCircle, FaUsers,
    FaComments, FaFlag, FaEye, FaTimes, FaFilter, FaBell,
    FaChartBar, FaUserSecret, FaClock
} from 'react-icons/fa';
import {
    subscribeToFlags,
    resolveFlag,
    getSupportStats,
} from '../../services/moderationService';
import { SUPPORT_ROOMS } from '../../services/anonymousChatService';

const FLAG_LEVEL_STYLES = {
    emergency: { bg: 'bg-rose-50', border: 'border-rose-300', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
    high: { bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    elevated: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
    moderate: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
};

function formatTime(date) {
    if (!date) return '—';
    return new Date(date).toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function StatCard({ icon: Icon, label, value, color, bg }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${bg} rounded-2xl p-5 border border-gray-200 shadow-sm`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`text-lg ${color}`} />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
        </motion.div>
    );
}

export default function SupportModeration() {
    const [flags, setFlags] = useState([]);
    const [resolvedFlags, setResolvedFlags] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'resolved' | 'stats'
    const [selectedFlag, setSelectedFlag] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        // Subscribe to active flags
        const unsubActive = subscribeToFlags((data) => setFlags(data), false);
        const unsubResolved = subscribeToFlags((data) => setResolvedFlags(data), true);

        // Load stats
        getSupportStats().then(setStats);

        return () => {
            unsubActive();
            unsubResolved();
        };
    }, []);

    const handleResolve = async (flagId) => {
        setResolving(true);
        await resolveFlag(flagId, 'admin', adminNotes);
        setSelectedFlag(null);
        setAdminNotes('');
        setResolving(false);
        // Refresh stats
        getSupportStats().then(setStats);
    };

    const getRoomTitle = (roomId) => {
        return SUPPORT_ROOMS.find((r) => r.id === roomId)?.title || roomId;
    };

    const filteredFlags = (activeTab === 'active' ? flags : resolvedFlags).filter(
        (f) => filterLevel === 'all' || f.flagLevel === filterLevel
    );

    const emergencyCount = flags.filter((f) => f.flagLevel === 'emergency').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                            <FaShieldAlt className="text-white" />
                        </div>
                        Support Moderation
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor anonymous support rooms and manage flagged content</p>
                </div>

                {emergencyCount > 0 && (
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-100 border border-rose-300 rounded-2xl"
                    >
                        <FaBell className="text-rose-600 animate-pulse" />
                        <span className="text-rose-700 font-bold text-sm">{emergencyCount} Emergency Alert{emergencyCount > 1 ? 's' : ''}</span>
                    </motion.div>
                )}
            </motion.div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard icon={FaFlag} label="Total Flags" value={stats.totalFlags} color="text-red-500" bg="bg-red-50" />
                    <StatCard icon={FaExclamationTriangle} label="Unresolved" value={stats.unresolvedFlags} color="text-orange-500" bg="bg-orange-50" />
                    <StatCard icon={FaBell} label="Emergency" value={stats.emergencyAlerts} color="text-rose-500" bg="bg-rose-50" />
                    <StatCard icon={FaComments} label="Active Rooms" value={stats.activeRooms} color="text-blue-500" bg="bg-blue-50" />
                    <StatCard icon={FaUsers} label="Total Users" value={stats.totalUsers} color="text-purple-500" bg="bg-purple-50" />
                    <StatCard icon={FaUserSecret} label="Active Now" value={stats.totalParticipants} color="text-teal-500" bg="bg-teal-50" />
                </div>
            )}

            {/* Tabs + Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
                    {[
                        { key: 'active', label: `Active (${flags.length})`, icon: FaFlag },
                        { key: 'resolved', label: `Resolved (${resolvedFlags.length})`, icon: FaCheckCircle },
                        { key: 'stats', label: 'Room Stats', icon: FaChartBar },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="text-xs" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab !== 'stats' && (
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-400 text-sm" />
                        <select
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 bg-white"
                        >
                            <option value="all">All Levels</option>
                            <option value="emergency">Emergency</option>
                            <option value="high">High</option>
                            <option value="elevated">Elevated</option>
                            <option value="moderate">Moderate</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Room Stats Tab */}
            {activeTab === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SUPPORT_ROOMS.map((room, i) => (
                        <motion.div
                            key={room.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`bg-white rounded-2xl border ${room.borderColor} p-5 shadow-sm`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{room.icon}</span>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{room.title}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${room.color} text-white`}>
                                        {room.supportLevel}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span>Active participants</span>
                                    <span className="font-bold text-gray-900">
                                        {flags.filter((f) => f.roomId === room.id).length > 0 ? '—' : '0'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Flags in room</span>
                                    <span className="font-bold text-gray-900">
                                        {flags.filter((f) => f.roomId === room.id).length}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Flags List */}
            {activeTab !== 'stats' && (
                <div className="space-y-3">
                    {filteredFlags.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                            <FaCheckCircle className="text-4xl text-green-400 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">
                                {activeTab === 'active' ? 'No active flags — all clear!' : 'No resolved flags yet.'}
                            </p>
                        </div>
                    ) : (
                        filteredFlags.map((flag, i) => {
                            const style = FLAG_LEVEL_STYLES[flag.flagLevel] || FLAG_LEVEL_STYLES.moderate;
                            return (
                                <motion.div
                                    key={flag.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`${style.bg} border ${style.border} rounded-2xl p-5 shadow-sm`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className={`w-2.5 h-2.5 rounded-full ${style.dot} mt-2 flex-shrink-0 animate-pulse`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge} uppercase`}>
                                                        {flag.flagLevel}
                                                    </span>
                                                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                                        {flag.flagReason}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Room: <strong>{getRoomTitle(flag.roomId)}</strong>
                                                    </span>
                                                </div>

                                                {/* Message preview */}
                                                <p className="text-sm text-gray-800 bg-white/70 rounded-xl px-3 py-2 border border-gray-200 mb-2 line-clamp-2">
                                                    "{flag.messageText}"
                                                </p>

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <FaUserSecret className="text-xs" />
                                                        <span className="font-medium text-gray-700">{flag.anonymousName}</span>
                                                        <span className="text-gray-400">(internal: {flag.userId?.slice(0, 8)}…)</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FaClock className="text-xs" />
                                                        {formatTime(flag.createdAt)}
                                                    </span>
                                                </div>

                                                {flag.keywords?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {flag.keywords.map((kw) => (
                                                            <span key={kw} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                                                {kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {activeTab === 'active' && (
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => setSelectedFlag(flag)}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-colors shadow-sm"
                                                >
                                                    <FaEye className="text-xs" />
                                                    Review
                                                </button>
                                                <button
                                                    onClick={() => handleResolve(flag.id)}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
                                                >
                                                    <FaCheckCircle className="text-xs" />
                                                    Resolve
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Review Modal */}
            <AnimatePresence>
                {selectedFlag && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                            onClick={() => setSelectedFlag(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold text-gray-900">Review Flagged Message</h3>
                                    <button onClick={() => setSelectedFlag(null)} className="text-gray-400 hover:text-gray-600">
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-xs text-gray-500 mb-1">Message</p>
                                        <p className="text-sm text-gray-800">"{selectedFlag.messageText}"</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500">Anonymous Name</p>
                                            <p className="font-semibold text-gray-900">{selectedFlag.anonymousName}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500">Internal User ID</p>
                                            <p className="font-mono text-xs text-gray-700">{selectedFlag.userId}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500">Flag Level</p>
                                            <p className="font-semibold text-gray-900 capitalize">{selectedFlag.flagLevel}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-xl">
                                            <p className="text-xs text-gray-500">Room</p>
                                            <p className="font-semibold text-gray-900">{getRoomTitle(selectedFlag.roomId)}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-2 block">Admin Notes</label>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Add notes about this case (optional)…"
                                            rows={3}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setSelectedFlag(null)}
                                            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleResolve(selectedFlag.id)}
                                            disabled={resolving}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-60"
                                        >
                                            <FaCheckCircle />
                                            {resolving ? 'Resolving…' : 'Mark Resolved'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
