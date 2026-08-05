import React from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause } from 'react-icons/fa';

function SoundCard({ sound, isPlaying, isActive, onToggle }) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
        isActive
          ? `bg-gradient-to-br ${sound.gradient} border-transparent shadow-xl`
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Animated Background Effect */}
      {isActive && isPlaying && (
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <button
        onClick={onToggle}
        className="relative w-full p-4 flex items-center justify-between group"
      >
        {/* Left Side - Icon and Name */}
        <div className="flex items-center space-x-3">
          {/* Icon Container */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
              isActive
                ? 'bg-white/20 backdrop-blur-sm'
                : `bg-gradient-to-br ${sound.gradient} shadow-md`
            }`}
          >
            <span className={isActive ? 'filter brightness-0 invert' : ''}>
              {sound.icon}
            </span>
          </div>

          {/* Sound Name */}
          <div className="text-left">
            <p
              className={`font-bold text-sm transition-colors ${
                isActive ? 'text-white' : 'text-gray-900'
              }`}
            >
              {sound.name}
            </p>
            {isActive && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/80"
              >
                {isPlaying ? 'Now Playing' : 'Paused'}
              </motion.p>
            )}
          </div>
        </div>

        {/* Right Side - Play/Pause Button */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isActive
              ? 'bg-white/20 backdrop-blur-sm text-white'
              : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
          }`}
        >
          {isPlaying ? (
            <FaPause className="text-sm" />
          ) : (
            <FaPlay className="text-sm ml-0.5" />
          )}
        </div>
      </button>

      {/* Animated Equalizer Bars (only when playing) */}
      {isActive && isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 flex items-end justify-center space-x-1 px-4 pb-1">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-white/40 rounded-full"
              animate={{
                height: ['2px', `${Math.random() * 12 + 4}px`, '2px'],
              }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.05,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default SoundCard;
