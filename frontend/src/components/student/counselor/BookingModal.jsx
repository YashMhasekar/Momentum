import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaVideo, FaPhone, FaComments, FaMapMarkerAlt, FaCheckCircle, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import SlotPicker from './SlotPicker';
import { timeSlots } from '../../../data/counselorsData';

export default function BookingModal({ counselor, isOpen, onClose, onConfirm }) {
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        date: '',
        timeSlot: '',
        sessionMode: '',
        concern: ''
    });

    if (!counselor) return null;

    const sessionModes = [
        { name: 'Video Call', icon: FaVideo, description: 'Face-to-face video session' },
        { name: 'Audio Call', icon: FaPhone, description: 'Voice-only session' },
        { name: 'Chat Session', icon: FaComments, description: 'Text-based conversation' },
        { name: 'In-Person', icon: FaMapMarkerAlt, description: 'Meet at campus office' }
    ];

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleConfirm = () => {
        onConfirm({
            counselor: counselor.name,
            ...bookingData
        });
        onClose();
        // Reset
        setStep(1);
        setBookingData({
            date: '',
            timeSlot: '',
            sessionMode: '',
            concern: ''
        });
    };

    const isStepValid = () => {
        switch (step) {
            case 2:
                return bookingData.date !== '';
            case 3:
                return bookingData.timeSlot !== '';
            case 4:
                return bookingData.sessionMode !== '';
            default:
                return true;
        }
    };

    // Get tomorrow's date as minimum
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    // Get max date (30 days from now)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];

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
                        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Book Session</h2>
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <FaTimes className="text-gray-600" />
                                    </button>
                                </div>

                                {/* Progress Steps */}
                                <div className="flex items-center justify-between">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <React.Fragment key={s}>
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${s < step
                                                            ? 'bg-green-500 text-white'
                                                            : s === step
                                                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                                                : 'bg-gray-200 text-gray-500'
                                                        }`}
                                                >
                                                    {s < step ? <FaCheckCircle /> : s}
                                                </div>
                                                <span className="text-xs mt-1 text-gray-600 hidden sm:block">
                                                    {s === 1 && 'Counselor'}
                                                    {s === 2 && 'Date'}
                                                    {s === 3 && 'Time'}
                                                    {s === 4 && 'Mode'}
                                                    {s === 5 && 'Confirm'}
                                                </span>
                                            </div>
                                            {s < 5 && (
                                                <div
                                                    className={`flex-1 h-1 mx-2 rounded-full transition-all ${s < step ? 'bg-green-500' : 'bg-gray-200'
                                                        }`}
                                                />
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-8 py-6">
                                <AnimatePresence mode="wait">
                                    {/* Step 1: Counselor Info */}
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Selected Counselor</h3>
                                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                                                <img
                                                    src={counselor.photoURL}
                                                    alt={counselor.name}
                                                    className="w-20 h-20 rounded-xl object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '/person_icon.jpg';
                                                    }}
                                                />
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900">{counselor.name}</h4>
                                                    <p className="text-sm text-gray-600">{counselor.title}</p>
                                                    <p className="text-sm font-medium text-blue-600">{counselor.specialization}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 2: Select Date */}
                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Date</h3>
                                            <input
                                                type="date"
                                                min={minDate}
                                                max={maxDateStr}
                                                value={bookingData.date}
                                                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                                            />
                                            <p className="text-sm text-gray-500 mt-2">
                                                Select a date within the next 30 days
                                            </p>
                                        </motion.div>
                                    )}

                                    {/* Step 3: Select Time Slot */}
                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <SlotPicker
                                                slots={timeSlots}
                                                selectedSlot={bookingData.timeSlot}
                                                onSelectSlot={(time) => setBookingData({ ...bookingData, timeSlot: time })}
                                            />
                                        </motion.div>
                                    )}

                                    {/* Step 4: Select Session Mode */}
                                    {step === 4 && (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Choose Session Mode</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {sessionModes
                                                    .filter((mode) => counselor.sessionModes.includes(mode.name))
                                                    .map((mode) => (
                                                        <motion.button
                                                            key={mode.name}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setBookingData({ ...bookingData, sessionMode: mode.name })}
                                                            className={`p-6 rounded-2xl border-2 transition-all text-left ${bookingData.sessionMode === mode.name
                                                                    ? 'border-blue-500 bg-blue-50'
                                                                    : 'border-gray-200 hover:border-blue-300'
                                                                }`}
                                                        >
                                                            <mode.icon
                                                                className={`text-3xl mb-3 ${bookingData.sessionMode === mode.name ? 'text-blue-600' : 'text-gray-600'
                                                                    }`}
                                                            />
                                                            <h4 className="font-bold text-gray-900 mb-1">{mode.name}</h4>
                                                            <p className="text-sm text-gray-600">{mode.description}</p>
                                                        </motion.button>
                                                    ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Step 5: Confirmation */}
                                    {step === 5 && (
                                        <motion.div
                                            key="step5"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                        >
                                            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Concern (Optional)</h3>
                                            <textarea
                                                value={bookingData.concern}
                                                onChange={(e) => setBookingData({ ...bookingData, concern: e.target.value })}
                                                placeholder="Briefly describe what you'd like to discuss (optional)..."
                                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                                                rows="4"
                                            />

                                            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                                                <h4 className="font-bold text-gray-900 mb-4">Booking Summary</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Counselor:</span>
                                                        <span className="font-semibold text-gray-900">{counselor.name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Date:</span>
                                                        <span className="font-semibold text-gray-900">
                                                            {new Date(bookingData.date).toLocaleDateString('en-US', {
                                                                weekday: 'long',
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Time:</span>
                                                        <span className="font-semibold text-gray-900">{bookingData.timeSlot}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Mode:</span>
                                                        <span className="font-semibold text-gray-900">{bookingData.sessionMode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 rounded-b-3xl">
                                <div className="flex gap-4">
                                    {step > 1 && (
                                        <button
                                            onClick={handleBack}
                                            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-colors"
                                        >
                                            <FaArrowLeft />
                                            Back
                                        </button>
                                    )}
                                    {step < 5 ? (
                                        <button
                                            onClick={handleNext}
                                            disabled={!isStepValid()}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                            <FaArrowRight />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleConfirm}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                        >
                                            <FaCheckCircle />
                                            Confirm Booking
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
