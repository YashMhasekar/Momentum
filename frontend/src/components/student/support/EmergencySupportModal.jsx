import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPhoneAlt, FaCalendarCheck, FaExclamationCircle, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function EmergencySupportModal({ isOpen, onClose, triggerLevel = 'elevated' }) {
    const navigate = useNavigate();

    const isEmergency = triggerLevel === 'emergency';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className={`p-6 ${isEmergency ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                            {isEmergency
                                                ? <FaExclamationCircle className="text-white text-2xl" />
                                                : <FaHeart className="text-white text-2xl" />
                                            }
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">
                                                {isEmergency ? 'We\'re Here For You' : 'You\'re Not Alone'}
                                            </h2>
                                            <p className="text-white/80 text-sm">
                                                {isEmergency
                                                    ? 'Immediate support is available right now'
                                                    : 'Professional support can help you through this'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p className="text-gray-700 text-sm leading-relaxed mb-6">
                                    {isEmergency
                                        ? 'It sounds like you\'re going through something really difficult right now. Please know that you matter, and there are people who want to help. Would you like to connect with a counselor privately?'
                                        : 'It seems like you\'re carrying a heavy load. Talking to a counselor or peer mentor can make a real difference. Would you like to connect?'
                                    }
                                </p>

                                <div className="space-y-3">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { navigate('/student/counselor'); onClose(); }}
                                        className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-2xl shadow-lg transition-all"
                                    >
                                        <FaCalendarCheck className="text-lg" />
                                        <div className="text-left">
                                            <div className="text-sm font-bold">Talk to a Counselor</div>
                                            <div className="text-xs text-white/80">Book a private, confidential session</div>
                                        </div>
                                    </motion.button>

                                    {isEmergency && (
                                        <motion.a
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            href="tel:988"
                                            className="w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold rounded-2xl shadow-lg transition-all"
                                        >
                                            <FaPhoneAlt className="text-lg" />
                                            <div className="text-left">
                                                <div className="text-sm font-bold">Call Crisis Helpline</div>
                                                <div className="text-xs text-white/80">988 — Available 24/7, free & confidential</div>
                                            </div>
                                        </motion.a>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="w-full px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-2xl transition-colors text-sm"
                                    >
                                        I'm okay, continue chatting
                                    </button>
                                </div>

                                {/* Crisis resources */}
                                <div className="mt-5 p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">Crisis Resources</p>
                                    <div className="space-y-1 text-xs text-gray-500">
                                        <p>• Suicide & Crisis Lifeline: <span className="font-bold text-gray-700">988</span></p>
                                        <p>• Crisis Text Line: Text <span className="font-bold text-gray-700">HELLO</span> to <span className="font-bold text-gray-700">741741</span></p>
                                        <p>• iCall (India): <span className="font-bold text-gray-700">9152987821</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
