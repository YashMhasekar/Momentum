import React from 'react';
import { motion } from 'framer-motion';
import { FaBrain, FaSmile, FaHeart, FaEye } from 'react-icons/fa';

const WellnessCard = ({ icon: Icon, title, value, score, color, bgColor }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className={`${bgColor} rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
                    <Icon className={`text-2xl ${color}`} />
                </div>
                <span className={`text-2xl font-bold ${color}`}>{score}%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
            <p className={`text-lg font-semibold ${color}`}>{value}</p>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full ${color} bg-opacity-50 rounded-full`}
                />
            </div>
        </motion.div>
    );
};

export default function WellnessStatusCards({ wellnessData }) {
    const cards = [
        {
            icon: FaBrain,
            title: 'Stress Level',
            value: wellnessData.stressLevel,
            score: 100 - wellnessData.stressScore,
            color: wellnessData.stressScore > 60 ? 'text-red-500' : wellnessData.stressScore > 40 ? 'text-orange-500' : 'text-green-500',
            bgColor: 'bg-white'
        },
        {
            icon: FaSmile,
            title: 'Mood Status',
            value: wellnessData.mood,
            score: wellnessData.moodScore,
            color: 'text-blue-500',
            bgColor: 'bg-white'
        },
        {
            icon: FaHeart,
            title: 'Wellness Score',
            value: `${wellnessData.wellnessScore}/100`,
            score: wellnessData.wellnessScore,
            color: 'text-purple-500',
            bgColor: 'bg-white'
        },
        {
            icon: FaEye,
            title: 'Focus Status',
            value: wellnessData.focusStatus,
            score: wellnessData.focusScore,
            color: 'text-teal-500',
            bgColor: 'bg-white'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, index) => (
                <WellnessCard key={index} {...card} />
            ))}
        </div>
    );
}
