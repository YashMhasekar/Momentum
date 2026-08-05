import React from 'react';
import { motion } from 'framer-motion';
import { FaVideo, FaPhone, FaComments, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaCheckCircle, FaHourglassHalf, FaEdit, FaTimes } from 'react-icons/fa';

export default function BookingTimeline({ bookings, onReschedule, onCancel, onJoin }) {
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'pending':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'cancelled':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed':
                return <FaCheckCircle />;
            case 'pending':
                return <FaHourglassHalf />;
            default:
                return null;
        }
    };

    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCalendarAlt className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Sessions</h3>
                <p className="text-gray-600">Book your first counseling session to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {bookings.map((booking, index) => (
                <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0">
                                    {getSessionIcon(booking.mode)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{booking.counselor}</h3>
                                    <p className="text-sm text-gray-600">{booking.counselorTitle}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full border flex items-center gap-2 text-sm font-medium ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                <span className="capitalize">{booking.status}</span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-gray-700">
                                <FaCalendarAlt className="text-blue-500" />
                                <span className="text-sm">
                                    {new Date(booking.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <FaClock className="text-purple-500" />
                                <span className="text-sm">{booking.time} ({booking.duration})</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                {getSessionIcon(booking.mode)}
                                <span className="text-sm">{booking.mode}</span>
                            </div>
                        </div>

                        {/* Concern */}
                        {booking.concern && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">Concern: </span>
                                    {booking.concern}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                            {booking.status === 'confirmed' && (
                                <button
                                    onClick={() => onJoin(booking)}
                                    className="flex-1 sm:flex-none px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium rounded-xl transition-all shadow-md hover:shadow-lg"
                                >
                                    Join Session
                                </button>
                            )}
                            <button
                                onClick={() => onReschedule(booking)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-xl transition-colors"
                            >
                                <FaEdit />
                                Reschedule
                            </button>
                            <button
                                onClick={() => onCancel(booking)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors"
                            >
                                <FaTimes />
                                Cancel
                            </button>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
