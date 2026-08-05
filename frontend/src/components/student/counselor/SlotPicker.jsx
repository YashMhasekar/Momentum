import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaClock } from 'react-icons/fa';

export default function SlotPicker({ slots, selectedSlot, onSelectSlot }) {
    return (
        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Time Slot</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {slots.map((slot, index) => (
                    <motion.button
                        key={index}
                        whileHover={slot.available ? { scale: 1.05 } : {}}
                        whileTap={slot.available ? { scale: 0.95 } : {}}
                        onClick={() => slot.available && onSelectSlot(slot.time)}
                        disabled={!slot.available}
                        className={`
              relative px-4 py-3 rounded-xl font-medium transition-all
              ${slot.available
                                ? selectedSlot === slot.time
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                    : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-500 hover:shadow-md'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
            `}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {selectedSlot === slot.time && <FaCheck className="text-sm" />}
                            <FaClock className="text-sm" />
                            <span>{slot.time}</span>
                        </div>
                        {!slot.available && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-gray-400 transform rotate-12"></div>
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
