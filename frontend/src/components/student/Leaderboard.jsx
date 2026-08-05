import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrophy, FaFire, FaStar, FaCheckCircle, FaTimes,
    FaHistory, FaCalendarAlt, FaInfoCircle, FaBrain,
    FaRocket, FaChartLine, FaCrown
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
    fetchLeaderboard,
    getStudentRank,
    searchStudents,
    TIME_PERIODS
} from '../../services/leaderboardService';

// ----------------------------------------------------------------------
// Cache for leaderboard data (performance optimisation)
// ----------------------------------------------------------------------
const leaderboardCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ----------------------------------------------------------------------
// Helper: derive level title from momentum score
// ----------------------------------------------------------------------
function getLevelTitle(momentumScore) {
    if (momentumScore >= 100) return 'Expert';
    if (momentumScore >= 75) return 'Advanced';
    if (momentumScore >= 50) return 'Intermediate';
    if (momentumScore >= 25) return 'Learner';
    return 'Beginner';
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function Leaderboard() {
    const { currentUser } = useAuth();

    const [userStats, setUserStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const [timeframe, setTimeframe] = useState(TIME_PERIODS.ALL_TIME);
    const [switchingPeriod, setSwitchingPeriod] = useState(false);

    // ------------------------------------------------------------------
    // Fetch data (with cache, parallel requests, and switching indicator)
    // ------------------------------------------------------------------
    const fetchUserStats = useCallback(async () => {
        const cacheKey = `${timeframe}_${currentUser?.uid || 'guest'}`;
        const cached = leaderboardCache.get(cacheKey);

        // Serve from cache instantly
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            setUserStats(cached.leaderboard);
            // Extract rank number from cached rank data
            setCurrentUserRank(typeof cached.rankData === 'number' ? cached.rankData : cached.rankData?.rank || null);
            setLoading(false);
            setSwitchingPeriod(false);
            return;
        }

        // Show switching overlay if data already exists, else full loading spinner
        const hasExistingData = userStats.length > 0;
        if (hasExistingData) {
            setSwitchingPeriod(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            const startTime = performance.now();

            const [leaderboardData, rankData] = await Promise.all([
                fetchLeaderboard(timeframe, null, 100),
                currentUser ? getStudentRank(currentUser.uid, timeframe) : Promise.resolve(null)
            ]);

            const endTime = performance.now();
            console.log(`Leaderboard loaded in ${(endTime - startTime).toFixed(0)}ms`);

            const enrichedData = leaderboardData.map((student, index) => ({
                id: student.id,
                uid: student.id,
                rank: index + 1,
                displayName: student.name || 'Anonymous',
                photoURL: student.photoURL || null,
                points: student.momentumScore || 0,
                level: Math.floor((student.momentumScore || 0) / 20) + 1,
                completedSkills: student.completedTasks || 0,
                streak: student.streak || 0,
                badges: student.badges || [],
                currentRole: 'Student',
                targetRole: null,
                department: student.department || 'General',
                totalStudyHours: student.totalStudyHours || 0,
                focusScore: student.focusScore || 0
            }));

            // Determine the rank number to store
            let rankNumber = null;
            if (rankData && rankData.rank) {
                rankNumber = rankData.rank;
            } else {
                const userIndex = enrichedData.findIndex(u => u.uid === currentUser?.uid);
                if (userIndex >= 0) {
                    rankNumber = userIndex + 1;
                }
            }

            leaderboardCache.set(cacheKey, {
                leaderboard: enrichedData,
                rankData: rankNumber, // Store just the number, not the object
                timestamp: Date.now()
            });

            setUserStats(enrichedData);
            setCurrentUserRank(rankNumber);
        } catch (err) {
            console.error('Leaderboard fetch error:', err);
            setError('Failed to load leaderboard. Please try again later.');
        } finally {
            setLoading(false);
            setSwitchingPeriod(false);
        }
    }, [timeframe, currentUser]);

    useEffect(() => {
        fetchUserStats();
    }, [fetchUserStats]);

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleTimeframeChange = (newTimeframe) => {
        if (newTimeframe !== timeframe) {
            setTimeframe(newTimeframe);
        }
    };

    // ------------------------------------------------------------------
    // Memoised derived data (performance)
    // ------------------------------------------------------------------
    const podiumUsers = useMemo(() => {
        const top = userStats.slice(0, 3);
        while (top.length < 3) top.push(null);
        return [top[1], top[0], top[2]]; // order: 2nd, 1st, 3rd
    }, [userStats]);

    const remainingUsers = useMemo(() => userStats.slice(3), [userStats]);

    // ------------------------------------------------------------------
    // Render podium with glass‑card styling
    // ------------------------------------------------------------------
    const renderPodium = () => {
        const podiumHeights = ['200px', '240px', '180px'];
        const podiumColors = [
            'linear-gradient(180deg, #E5E7EB 0%, #D1D5DB 100%)', // Silver
            'linear-gradient(180deg, #FCD34D 0%, #F59E0B 100%)', // Gold
            'linear-gradient(180deg, #F97316 0%, #EA580C 100%)'   // Bronze
        ];
        const rankBadgeColors = ['#6B7280', '#F59E0B', '#EA580C'];
        const rankNumbers = [2, 1, 3];

        return (
            <div className="flex justify-center items-end gap-6 mb-12 px-4">
                {podiumUsers.map((user, index) => {
                    const actualRank = rankNumbers[index];
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15, type: 'spring', stiffness: 100 }}
                            className="flex flex-col items-center"
                            style={{ width: '140px' }}
                        >
                            {user && (
                                <motion.div
                                    className="flex flex-col items-center mb-4 cursor-pointer"
                                    whileHover={{ y: -5 }}
                                    onClick={() => handleUserClick(user)}
                                >
                                    <div className="relative mb-2">
                                        <img
                                            src={user.photoURL || '/person_icon.jpg'}
                                            alt={user.displayName}
                                            className="w-20 h-20 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/person_icon.jpg';
                                            }}
                                        />
                                        <div
                                            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                                            style={{ backgroundColor: rankBadgeColors[index] }}
                                        >
                                            {actualRank}
                                        </div>
                                        {actualRank === 1 && (
                                            <motion.div
                                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-3xl"
                                            >
                                                <FaCrown className="text-yellow-400 drop-shadow-lg" />
                                            </motion.div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-sm mb-1 text-center truncate w-full px-2 text-black">
                                        {user.displayName}
                                    </h3>
                                    <p className="text-blue-500 font-medium text-sm">{user.points} pts</p>
                                </motion.div>
                            )}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: podiumHeights[index] }}
                                transition={{ delay: 0.3 + index * 0.1, duration: 0.6, ease: 'easeOut' }}
                                className="w-full rounded-t-2xl shadow-lg"
                                style={{
                                    background: podiumColors[index],
                                    minHeight: podiumHeights[index]
                                }}
                            />
                        </motion.div>
                    );
                })}
            </div>
        );
    };

    // ------------------------------------------------------------------
    // Current user ranking card (if not in top 3)
    // ------------------------------------------------------------------
    const renderCurrentUserRanking = () => {
        if (!currentUser || !currentUserRank || currentUserRank <= 3) return null;

        const currentUserData = userStats.find(u => u.uid === currentUser.uid);
        if (!currentUserData) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h3 className="text-sm font-medium mb-3 text-gray-600">Your Ranking</h3>
                <div
                    className="rounded-2xl p-5 border-2 bg-blue-50"
                    style={{
                        borderColor: '#3B82F6'
                    }}
                >
                    <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                        <div className="flex-shrink-0 w-12 text-center">
                            <span className="text-2xl font-bold text-gray-900">{currentUserRank}</span>
                        </div>
                        <div className="flex-shrink-0">
                            <img
                                src={currentUserData.photoURL || '/person_icon.jpg'}
                                alt={currentUserData.displayName}
                                className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/person_icon.jpg';
                                }}
                            />
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-semibold text-black">{currentUserData.displayName}</h4>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="flex items-center text-xs text-gray-600">
                                    <FaStar className="mr-1 text-yellow-500" />
                                    {currentUserData.streak} day streak
                                </span>
                                <span className="flex items-center text-xs text-gray-600">
                                    <FaCheckCircle className="mr-1 text-green-500" />
                                    {currentUserData.completedSkills} completed
                                </span>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <div className="px-4 py-2 rounded-full bg-blue-500 text-white">
                                <span className="font-bold text-lg">{currentUserData.points}</span>
                                <span className="text-xs ml-1">pts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    // ------------------------------------------------------------------
    // Remaining leaderboard list (white card entries)
    // ------------------------------------------------------------------
    const renderLeaderboardList = () => {
        if (remainingUsers.length === 0) {
            return (
                <div className="p-8 text-center rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-gray-600">No more rankings available</p>
                </div>
            );
        }

        return (
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Top Rankings</h3>
                <div className="space-y-3">
                    {remainingUsers.map((user, index) => {
                        const isCurrentUser = currentUser && user.uid === currentUser.uid;
                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                className={`flex items-center p-4 rounded-xl cursor-pointer transition-all 
                                    ${isCurrentUser
                                        ? 'ring-2 ring-blue-500 bg-blue-50'
                                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                    }`}
                                onClick={() => handleUserClick(user)}
                            >
                                <div className="flex-shrink-0 w-10 text-center">
                                    <span className="text-lg font-semibold text-gray-600">{user.rank}</span>
                                </div>
                                <div className="flex-shrink-0 mx-3">
                                    <img
                                        src={user.photoURL || '/person_icon.jpg'}
                                        alt={user.displayName}
                                        className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/person_icon.jpg';
                                        }}
                                    />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-semibold text-sm text-black truncate">
                                        {user.displayName}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                        <span className="flex items-center text-xs text-gray-600">
                                            <FaStar className="mr-1 text-yellow-500" />
                                            {user.streak} day streak
                                        </span>
                                        <span className="flex items-center text-xs text-gray-600">
                                            <FaCheckCircle className="mr-1 text-green-500" />
                                            {user.completedSkills} completed
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                    <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-600">
                                        <span className="font-bold">{user.points}</span>
                                        <span className="text-xs ml-1">pts</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // ------------------------------------------------------------------
    // Main Layout
    // ------------------------------------------------------------------
    return (
        <div className="min-h-screen p-4 md:p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                {/* White background card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6 border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <motion.h2
                                initial={{ x: -20 }}
                                animate={{ x: 0 }}
                                className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2"
                            >
                                <FaTrophy className="text-yellow-500" />
                                Leaderboard
                            </motion.h2>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 rounded-full text-blue-500 hover:bg-gray-100"
                                onClick={() => setShowInfoModal(true)}
                            >
                                <FaInfoCircle className="text-xl" />
                            </motion.button>
                        </div>

                        {/* Timeframe selector with loading overlay */}
                        <div className="flex gap-2 mt-4 relative">
                            {switchingPeriod && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                                        <span className="text-sm text-gray-600">Switching...</span>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => handleTimeframeChange(TIME_PERIODS.ALL_TIME)}
                                disabled={switchingPeriod}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all 
                                    ${timeframe === TIME_PERIODS.ALL_TIME
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <FaHistory className="mr-2" />
                                All Time
                            </button>
                            <button
                                onClick={() => handleTimeframeChange(TIME_PERIODS.MONTHLY)}
                                disabled={switchingPeriod}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all 
                                    ${timeframe === TIME_PERIODS.MONTHLY
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <FaCalendarAlt className="mr-2" />
                                Monthly
                            </button>
                            <button
                                onClick={() => handleTimeframeChange(TIME_PERIODS.WEEKLY)}
                                disabled={switchingPeriod}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all 
                                    ${timeframe === TIME_PERIODS.WEEKLY
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <FaFire className="mr-2" />
                                Weekly
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <FaTrophy className="text-2xl text-blue-500 animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-gray-600 mt-4 font-medium">Loading leaderboard...</p>
                                <p className="text-gray-400 text-sm mt-1">Fetching rankings</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center rounded-xl bg-red-50 border border-red-200">
                                <p className="text-red-600 font-medium">{error}</p>
                                <button
                                    onClick={fetchUserStats}
                                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <>
                                {renderPodium()}
                                {renderCurrentUserRanking()}
                                {renderLeaderboardList()}
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* INFO MODAL (Momentum Score explanation) */}
            <AnimatePresence>
                {showInfoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowInfoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
                                onClick={() => setShowInfoModal(false)}
                            >
                                <FaTimes className="text-gray-600" />
                            </button>
                            <h2 className="text-xl font-bold mb-4 text-gray-900">How Rankings Work</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold flex items-center text-gray-800">
                                        <FaStar className="mr-2 text-yellow-500" />
                                        Momentum Score System
                                    </h3>
                                    <ul className="mt-2 space-y-2 pl-6 text-sm text-gray-600">
                                        <li className="flex items-start">
                                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2 mr-2"></span>
                                            <span><strong>Study Hours:</strong> More study time = higher score</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2 mr-2"></span>
                                            <span><strong>Productive Score:</strong> Better focus = bonus points</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2 mr-2"></span>
                                            <span><strong>Streak Bonus:</strong> Consistent daily study</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mt-2 mr-2"></span>
                                            <span><strong>Task Completion:</strong> Finishing tasks adds points</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* USER PROFILE MODAL (detailed stats) */}
            <AnimatePresence>
                {showUserModal && selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowUserModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 z-10"
                                onClick={() => setShowUserModal(false)}
                            >
                                <FaTimes className="text-white drop-shadow" />
                            </button>

                            {/* Header gradient */}
                            <div className="p-6 bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center">
                                <img
                                    src={selectedUser.photoURL || '/person_icon.jpg'}
                                    alt={selectedUser.displayName}
                                    className="h-20 w-20 rounded-full border-4 border-white shadow-lg object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/person_icon.jpg';
                                    }}
                                />
                                <div className="ml-4 text-white">
                                    <h2 className="text-xl font-bold">{selectedUser.displayName}</h2>
                                    <p className="text-sm text-blue-100">{getLevelTitle(selectedUser.points)}</p>
                                    <div className="mt-2 px-3 py-1 rounded-full inline-flex items-center bg-white/20 backdrop-blur-sm">
                                        <span className="font-bold text-yellow-300">#{selectedUser.rank}</span>
                                        <span className="ml-1 text-xs">Rank</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick stats (3 columns) */}
                            <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-200">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-yellow-500/20 mb-2">
                                        <FaStar className="text-xl text-yellow-500" />
                                    </div>
                                    <span className="text-sm text-gray-600">Level</span>
                                    <span className="font-bold text-gray-900">{selectedUser.level}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-green-500/20 mb-2">
                                        <FaCheckCircle className="text-xl text-green-500" />
                                    </div>
                                    <span className="text-sm text-gray-600">Tasks</span>
                                    <span className="font-bold text-gray-900">{selectedUser.completedSkills}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full flex items-center justify-center bg-blue-500/20 mb-2">
                                        <FaChartLine className="text-xl text-blue-500" />
                                    </div>
                                    <span className="text-sm text-gray-600">Score</span>
                                    <span className="font-bold text-gray-900">{selectedUser.points}</span>
                                </div>
                            </div>

                            {/* Performance details */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">Performance</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <FaBrain className="text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Study Hours</p>
                                            <p className="font-medium text-gray-900">{selectedUser.totalStudyHours} h</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                            <FaRocket className="text-cyan-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Productive Score</p>
                                            <p className="font-medium text-gray-900">{selectedUser.focusScore}%</p>
                                        </div>
                                    </div>
                                    {selectedUser.streak > 0 && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                                <FaFire className="text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Current Streak</p>
                                                <p className="font-medium text-gray-900">{selectedUser.streak} days</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}