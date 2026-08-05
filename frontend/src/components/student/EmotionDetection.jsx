import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
    detectEmotion,
    analyzeEmotionSession,
    saveEmotionSession,
    getEmotionEmoji,
    getEmotionColor,
    getWellnessLevelInfo
} from '../../services/emotionDetectionService';
import {
    FaCamera, FaStop, FaPlay, FaSmile, FaChartLine, FaLightbulb,
    FaCheckCircle, FaExclamationTriangle, FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';

function EmotionDetection() {
    const { currentUser } = useAuth();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [stream, setStream] = useState(null);
    const [currentEmotion, setCurrentEmotion] = useState(null);
    const [emotions, setEmotions] = useState([]);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(6);
    const [sessionAnalysis, setSessionAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sessionType, setSessionType] = useState('study');

    const DETECTION_DURATION = 6; // seconds
    const DETECTION_INTERVAL = 500; // ms

    useEffect(() => {
        return () => {
            // Cleanup: stop camera when component unmounts
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    useEffect(() => {
        if (isDetecting && timeRemaining > 0) {
            const timer = setTimeout(() => {
                setTimeRemaining(timeRemaining - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isDetecting && timeRemaining === 0) {
            stopDetection();
        }
    }, [isDetecting, timeRemaining]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            setStream(mediaStream);
            return true;
        } catch (error) {
            console.error('Error accessing camera:', error);
            toast.error('Unable to access camera. Please grant camera permissions.');
            return false;
        }
    };

    const captureFrame = () => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/jpeg', 0.8);
    };

    const startDetection = async () => {
        const cameraStarted = await startCamera();
        if (!cameraStarted) return;

        setIsDetecting(true);
        setEmotions([]);
        setCurrentEmotion(null);
        setSessionAnalysis(null);
        setSessionStartTime(Date.now());
        setTimeRemaining(DETECTION_DURATION);

        toast.info('Emotion detection started. Please look at the camera.');

        // Start detection loop
        const detectionInterval = setInterval(async () => {
            const imageData = captureFrame();
            if (!imageData) return;

            try {
                const result = await detectEmotion(currentUser.uid, imageData, sessionType);

                if (result.success && result.emotion) {
                    setCurrentEmotion({
                        emotion: result.emotion,
                        scores: result.scores,
                        timestamp: Date.now()
                    });

                    setEmotions(prev => [...prev, result.emotion]);
                }
            } catch (error) {
                console.error('Detection error:', error);
            }
        }, DETECTION_INTERVAL);

        // Store interval ID for cleanup
        window.emotionDetectionInterval = detectionInterval;
    };

    const stopDetection = async () => {
        setIsDetecting(false);

        // Clear detection interval
        if (window.emotionDetectionInterval) {
            clearInterval(window.emotionDetectionInterval);
            window.emotionDetectionInterval = null;
        }

        // Stop camera
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        // Analyze session if we have emotions
        if (emotions.length > 0) {
            await analyzeSession();
        } else {
            toast.warning('No emotions detected. Please try again.');
        }
    };

    const analyzeSession = async () => {
        setLoading(true);

        try {
            // Get analysis from AI service
            const analysisResult = await analyzeEmotionSession(
                currentUser.uid,
                emotions,
                sessionType
            );

            if (analysisResult.success) {
                const analysis = analysisResult.analysis;
                setSessionAnalysis(analysis);

                // Save to Firestore
                await saveEmotionSession({
                    userId: currentUser.uid,
                    sessionType,
                    dominantEmotion: analysis.dominantEmotion,
                    emotionDistribution: analysis.emotionDistribution,
                    wellnessScore: analysis.wellnessScore,
                    totalDetections: analysis.totalDetections,
                    aiInsight: analysis.aiInsight,
                    recommendations: analysis.recommendations,
                    emotions
                });

                toast.success('Emotion analysis complete!');
            }
        } catch (error) {
            console.error('Error analyzing session:', error);
            toast.error('Failed to analyze emotion session.');
        } finally {
            setLoading(false);
        }
    };

    const resetSession = () => {
        setEmotions([]);
        setCurrentEmotion(null);
        setSessionAnalysis(null);
        setTimeRemaining(DETECTION_DURATION);
    };

    const wellnessInfo = sessionAnalysis
        ? getWellnessLevelInfo(sessionAnalysis.wellnessScore)
        : null;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
                    AI Emotion Detection
                </h1>
                <p className="text-gray-600">
                    Real-time emotion analysis to understand your study state and wellbeing
                </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Camera Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-6"
                >
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Camera Feed</h2>
                        <p className="text-sm text-gray-600">
                            Position your face in the frame for accurate detection
                        </p>
                    </div>

                    {/* Session Type Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Type
                        </label>
                        <select
                            value={sessionType}
                            onChange={(e) => setSessionType(e.target.value)}
                            disabled={isDetecting}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="study">Study Session</option>
                            <option value="focus">Focus Room</option>
                            <option value="general">General Check-in</option>
                        </select>
                    </div>

                    {/* Video Feed */}
                    <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Overlay */}
                        {isDetecting && (
                            <div className="absolute inset-0 border-4 border-purple-500 rounded-xl pointer-events-none">
                                <div className="absolute top-4 left-4 bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold">
                                    Detecting... {timeRemaining}s
                                </div>
                            </div>
                        )}

                        {/* Current Emotion Display */}
                        {currentEmotion && isDetecting && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute bottom-4 right-4 bg-white rounded-xl p-4 shadow-lg"
                            >
                                <div className="text-center">
                                    <div className="text-4xl mb-2">
                                        {getEmotionEmoji(currentEmotion.emotion)}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 capitalize">
                                        {currentEmotion.emotion}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* No Camera Placeholder */}
                        {!stream && !isDetecting && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <FaCamera className="text-6xl mx-auto mb-4" />
                                    <p>Camera not active</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex space-x-3">
                        {!isDetecting ? (
                            <button
                                onClick={startDetection}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                <FaPlay />
                                <span>Start Detection</span>
                            </button>
                        ) : (
                            <button
                                onClick={stopDetection}
                                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                            >
                                <FaStop />
                                <span>Stop Detection</span>
                            </button>
                        )}

                        {sessionAnalysis && (
                            <button
                                onClick={resetSession}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* Detection Progress */}
                    {isDetecting && (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Detection Progress</span>
                                <span>{emotions.length} frames captured</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((DETECTION_DURATION - timeRemaining) / DETECTION_DURATION) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                                />
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Results Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {loading && (
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center">
                            <FaSpinner className="text-4xl text-purple-600 animate-spin mx-auto mb-4" />
                            <p className="text-gray-600">Analyzing your emotions...</p>
                        </div>
                    )}

                    {sessionAnalysis && !loading && (
                        <>
                            {/* Wellness Score */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-900">Wellness Score</h3>
                                    <div className="text-5xl">{wellnessInfo.emoji}</div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-end space-x-2 mb-2">
                                        <span className="text-5xl font-bold" style={{ color: wellnessInfo.color }}>
                                            {sessionAnalysis.wellnessScore}
                                        </span>
                                        <span className="text-2xl text-gray-600 mb-2">/100</span>
                                    </div>
                                    <p className="text-lg font-semibold" style={{ color: wellnessInfo.color }}>
                                        {wellnessInfo.label}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {wellnessInfo.description}
                                    </p>
                                </div>

                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${sessionAnalysis.wellnessScore}%` }}
                                        transition={{ duration: 1, delay: 0.3 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: wellnessInfo.color }}
                                    />
                                </div>
                            </div>

                            {/* Dominant Emotion */}
                            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Dominant Emotion</h3>
                                <div className="flex items-center space-x-4">
                                    <div className="text-6xl">
                                        {getEmotionEmoji(sessionAnalysis.dominantEmotion)}
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 capitalize">
                                            {sessionAnalysis.dominantEmotion}
                                        </p>
                                        <p className="text-gray-600">
                                            {sessionAnalysis.dominantPercentage}% of the session
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Emotion Distribution */}
                            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Emotion Distribution</h3>
                                <div className="space-y-3">
                                    {Object.entries(sessionAnalysis.emotionDistribution)
                                        .sort((a, b) => b[1].percentage - a[1].percentage)
                                        .map(([emotion, data]) => (
                                            <div key={emotion}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xl">{getEmotionEmoji(emotion)}</span>
                                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                                            {emotion}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {data.percentage}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${data.percentage}%` }}
                                                        transition={{ duration: 0.5 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: getEmotionColor(emotion) }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* AI Insight */}
                            {sessionAnalysis.aiInsight && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FaLightbulb className="text-white text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">AI Insight</h3>
                                            <p className="text-gray-700 leading-relaxed">
                                                {sessionAnalysis.aiInsight}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {sessionAnalysis.recommendations && sessionAnalysis.recommendations.length > 0 && (
                                <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h3>
                                    <div className="space-y-3">
                                        {sessionAnalysis.recommendations.map((rec, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl"
                                            >
                                                <div className="text-2xl flex-shrink-0">{rec.icon}</div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 mb-1">{rec.title}</p>
                                                    <p className="text-sm text-gray-600">{rec.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Initial State */}
                    {!sessionAnalysis && !loading && !isDetecting && (
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center">
                            <FaSmile className="text-6xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Ready to Detect Emotions
                            </h3>
                            <p className="text-gray-600">
                                Click "Start Detection" to begin analyzing your emotional state
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default EmotionDetection;
