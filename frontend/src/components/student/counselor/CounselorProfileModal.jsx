import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar, FaVideo, FaPhone, FaComments, FaMapMarkerAlt, FaClock, FaCheckCircle } from 'react-icons/fa';

export default function CounselorProfileModal({ counselor, isOpen, onClose, onBookSession }) {
    if (!counselor) return null;

    const getSessionIcon = (mode) => {
        switch (mode) {
            case 'Video Call':
                return <FaVideo />;
            case 'Audio Call':
                return <FaPhone />;
            case 'Chat Session':
                return <FaComments />;
            case 'In-Person':
                return <FaMapMarkerAlt />;
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header with gradient */}
                            <div className="relative h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                                >
                                    <FaTimes />
                                </button>

                                {/* Profile Image */}
                                <div className="absolute -bottom-16 left-8">
                                    <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                                        <img
                                            src={counselor.photoURL}
                                            alt={counselor.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/person_icon.jpg';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="pt-20 px-8 pb-8">
                                {/* Name and Title */}
                                <div className="mb-6">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{counselor.name}</h2>
                                    <p className="text-lg text-gray-600 mb-1">{counselor.title}</p>
                                    <p className="text-md font-medium text-blue-600">{counselor.specialization}</p>
                                </div>

                                {/* Stats */}
                                <div className="flex flex-wrap gap-6 mb-6">
                                    <div className="flex items-center gap-2">
                                        <FaStar className="text-yellow-500 text-xl" />
                                        <span className="text-lg font-semibold text-gray-900">{counselor.rating}</span>
                                        <span className="text-sm text-gray-500">({counselor.reviewCount} reviews)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaCheckCircle className="text-green-500 text-xl" />
                                        <span className="text-lg font-semibold text-gray-900">{counselor.experience} years</span>
                                        <span className="text-sm text-gray-500">experience</span>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
                                    <p className="text-gray-700 leading-relaxed">{counselor.bio}</p>
                                </div>

                                {/* Expertise */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Areas of Expertise</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {counselor.expertise.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-xl text-sm"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Session Details */}
                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    {/* Languages */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Languages</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {counselor.languages.map((lang, index) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 font-medium rounded-lg text-sm"
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Session Timings */}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Session Timings</h3>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <FaClock className="text-blue-500" />
                                            <span>{counselor.sessionTimings}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Session Modes */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">Available Session Modes</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {counselor.sessionModes.map((mode, index) => (
                                            <div
                                                key={index}
                                                className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                                            >
                                                <div className="text-2xl text-blue-600">
                                                    {getSessionIcon(mode)}
                                                </div>
                                                <span className="text-xs font-medium text-gray-700 text-center">{mode}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Reviews */}
                                {counselor.reviews && counselor.reviews.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Student Reviews</h3>
                                        <div className="space-y-4">
                                            {counselor.reviews.map((review, index) => (
                                                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex">
                                                            {[...Array(review.rating)].map((_, i) => (
                                                                <FaStar key={i} className="text-yellow-500 text-sm" />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-600">{review.student}</span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm">{review.comment}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            onBookSession(counselor);
                                            onClose();
                                        }}
                                        className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                    >
                                        Book Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
