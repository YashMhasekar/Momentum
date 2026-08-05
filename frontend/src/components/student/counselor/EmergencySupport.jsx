import React from 'react';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaComments, FaExclamationTriangle, FaHeartbeat } from 'react-icons/fa';

export default function EmergencySupport() {
    const handleEmergencyContact = () => {
        // UI only - will be implemented with backend
        alert('Emergency contact feature - will connect to crisis helpline');
    };

    const handleQuickSupport = () => {
        // UI only - will be implemented with backend
        alert('Quick support feature - will connect to available counselor');
    };

    const handleImmediateSession = () => {
        // UI only - will be implemented with backend
        alert('Immediate session request - will notify on-call counselors');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl border-2 border-blue-200 p-8 shadow-lg"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                    <FaHeartbeat className="text-3xl text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Need Immediate Support?</h2>
                    <p className="text-gray-600">We're here for you 24/7</p>
                </div>
            </div>

            {/* Message */}
            <div className="mb-6 p-4 bg-white bg-opacity-60 rounded-2xl border border-blue-200">
                <p className="text-gray-700 leading-relaxed">
                    If you are feeling overwhelmed, emotionally distressed, or need someone to talk to right now,
                    please don't hesitate to reach out. Your well-being is our priority, and support is always available.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEmergencyContact}
                    className="flex flex-col items-center gap-3 p-6 bg-white hover:bg-blue-50 rounded-2xl border-2 border-blue-300 transition-all shadow-md hover:shadow-lg"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <FaPhoneAlt className="text-2xl text-white" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-gray-900 mb-1">Emergency Contact</h3>
                        <p className="text-sm text-gray-600">24/7 Crisis Helpline</p>
                    </div>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleQuickSupport}
                    className="flex flex-col items-center gap-3 p-6 bg-white hover:bg-purple-50 rounded-2xl border-2 border-purple-300 transition-all shadow-md hover:shadow-lg"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <FaComments className="text-2xl text-white" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-gray-900 mb-1">Quick Support</h3>
                        <p className="text-sm text-gray-600">Chat with peer counselor</p>
                    </div>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleImmediateSession}
                    className="flex flex-col items-center gap-3 p-6 bg-white hover:bg-teal-50 rounded-2xl border-2 border-teal-300 transition-all shadow-md hover:shadow-lg"
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-green-500 rounded-xl flex items-center justify-center">
                        <FaExclamationTriangle className="text-2xl text-white" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-gray-900 mb-1">Immediate Session</h3>
                        <p className="text-sm text-gray-600">Request urgent counseling</p>
                    </div>
                </motion.button>
            </div>

            {/* Additional Resources */}
            <div className="mt-6 p-4 bg-white bg-opacity-60 rounded-2xl border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">Crisis Resources</h4>
                <div className="space-y-1 text-sm text-gray-700">
                    <p>• National Suicide Prevention Lifeline: <span className="font-semibold">988</span></p>
                    <p>• Crisis Text Line: Text <span className="font-semibold">HELLO</span> to <span className="font-semibold">741741</span></p>
                    <p>• Campus Security: <span className="font-semibold">Available 24/7</span></p>
                </div>
            </div>
        </motion.div>
    );
}
