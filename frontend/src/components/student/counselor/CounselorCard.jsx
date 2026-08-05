import React from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaVideo, FaPhone, FaComments, FaMapMarkerAlt, FaCheckCircle, FaClock } from 'react-icons/fa';

export default function CounselorCard({ counselor, onViewProfile, onBookSession }) {
    const getAvailabilityColor = (status) => {
        switch (status) {
            case 'available':
                return 'text-green-500 bg-green-50';
            case 'busy':
                return 'text-orange-500 bg-orange-50';
            default:
                return 'text-gray-500 bg-gray-50';
        }
    };

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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
        >
            {/* Header with gradient */}
            <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500 relative">
                <div className="absolute -bottom-12 left-6">
                    <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gray-100">
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
            <div className="pt-16 px-6 pb-6">
                {/* Name and Title */}
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{counselor.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{counselor.title}</p>
                    <p className="text-sm font-medium text-blue-600">{counselor.specialization}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-500" />
                        <span className="text-sm font-semibold text-gray-900">{counselor.rating}</span>
                        <span className="text-xs text-gray-500">({counselor.reviewCount})</span>
                    </div>
                    <div className="text-sm text-gray-600">
                        {counselor.experience} years exp.
                    </div>
                </div>

                {/* Languages */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {counselor.languages.map((lang, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                        >
                            {lang}
                        </span>
                    ))}
                </div>

                {/* Session Modes */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {counselor.sessionModes.map((mode, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg"
                        >
                            {getSessionIcon(mode)}
                            <span>{mode}</span>
                        </div>
                    ))}
                </div>

                {/* Availability */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-4 ${getAvailabilityColor(counselor.availabilityStatus)}`}>
                    {counselor.availabilityStatus === 'available' ? (
                        <FaCheckCircle className="text-sm" />
                    ) : (
                        <FaClock className="text-sm" />
                    )}
                    <span className="text-sm font-medium">{counselor.availability}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => onViewProfile(counselor)}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl transition-colors"
                    >
                        View Profile
                    </button>
                    <button
                        onClick={() => onBookSession(counselor)}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                        Book Session
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
