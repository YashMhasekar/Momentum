import React from 'react';
import { motion } from 'framer-motion';

export default function CategoryCard({ category, onClick }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
        >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-3xl">{category.icon}</span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{category.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description}</p>

            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                    {category.availableCount} counselors
                </span>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </motion.div>
    );
}
