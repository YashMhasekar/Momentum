import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMusic, FaVolumeUp, FaVolumeMute, FaVolumeDown } from 'react-icons/fa';
import SoundCard from './SoundCard';

function AmbientSounds() {
  const [activeSound, setActiveSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const previousVolumeRef = useRef(0.5);

  // Sound definitions
  const sounds = [
    {
      id: 'rain',
      name: 'Rain',
      icon: '🌧️',
      gradient: 'from-blue-400 to-blue-600',
      file: '/sounds/rain.mp3',
    },
    {
      id: 'coffee',
      name: 'Coffee Shop',
      icon: '☕',
      gradient: 'from-amber-400 to-amber-600',
      file: '/sounds/coffee.mp3',
    },
    {
      id: 'forest',
      name: 'Forest',
      icon: '🌲',
      gradient: 'from-green-400 to-green-600',
      file: '/sounds/forest.mp3',
    },
    {
      id: 'ocean',
      name: 'Ocean Waves',
      icon: '🌊',
      gradient: 'from-cyan-400 to-cyan-600',
      file: '/sounds/ocean.mp3',
    },
    {
      id: 'white-noise',
      name: 'White Noise',
      icon: '🔊',
      gradient: 'from-gray-400 to-gray-600',
      file: '/sounds/white-noise.mp3',
    },
    {
      id: 'fireplace',
      name: 'Fireplace',
      icon: '🔥',
      gradient: 'from-orange-400 to-red-600',
      file: '/sounds/fireplace.mp3',
    },
  ];

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle sound toggle
  const handleSoundToggle = (soundId) => {
    const sound = sounds.find((s) => s.id === soundId);
    if (!sound) return;

    setError(null); // Clear any previous errors

    // If clicking the same sound, toggle play/pause
    if (activeSound === soundId) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch((err) => {
          console.error('Error playing audio:', err);
          setError('Unable to play audio. Please ensure audio files are in public/sounds/ directory.');
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    } else {
      // Switch to new sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = sound.file;
        audioRef.current.load();
        audioRef.current
          .play()
          .then(() => {
            setActiveSound(soundId);
            setIsPlaying(true);
            setError(null);
          })
          .catch((err) => {
            console.error('Error playing audio:', err);
            setError(`Unable to load ${sound.name}. Please add ${sound.file.split('/').pop()} to public/sounds/ directory.`);
            setIsPlaying(false);
            setActiveSound(null);
          });
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  // Get volume icon
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return FaVolumeMute;
    if (volume < 0.5) return FaVolumeDown;
    return FaVolumeUp;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-3xl p-6 shadow-lg"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaMusic className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Ambient Sounds</h3>
              <p className="text-xs text-gray-500">Enhance your focus</p>
            </div>
          </div>
        </div>

        {/* Volume Control */}
        <AnimatePresence>
          {activeSound && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4"
            >
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={toggleMute}
                  className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <VolumeIcon className="text-lg" />
                </motion.button>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">Volume</span>
                    <span className="text-xs font-bold text-purple-600">
                      {Math.round((isMuted ? 0 : volume) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #9333ea 0%, #3b82f6 ${
                        (isMuted ? 0 : volume) * 100
                      }%, #e5e7eb ${(isMuted ? 0 : volume) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sound Cards */}
      <div className="space-y-3">
        {sounds.map((sound, index) => (
          <motion.div
            key={sound.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <SoundCard
              sound={sound}
              isPlaying={activeSound === sound.id && isPlaying}
              isActive={activeSound === sound.id}
              onToggle={() => handleSoundToggle(sound.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Info Text */}
      {!activeSound && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl"
        >
          <p className="text-xs text-blue-700 text-center">
            💡 Select a sound to create the perfect focus environment
          </p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl"
        >
          <p className="text-xs text-red-700 text-center">
            ⚠️ {error}
          </p>
        </motion.div>
      )}

      {/* Now Playing Indicator */}
      {activeSound && isPlaying && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl"
        >
          <div className="flex items-center justify-center space-x-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-purple-600 rounded-full"
            />
            <p className="text-xs font-semibold text-purple-700">
              Now Playing: {sounds.find((s) => s.id === activeSound)?.name}
            </p>
          </div>
        </motion.div>
      )}

      {/* Custom Slider Styles */}
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </motion.div>
  );
}

export default AmbientSounds;
