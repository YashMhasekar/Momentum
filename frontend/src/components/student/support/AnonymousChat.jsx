import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaArrowLeft, FaPaperPlane, FaRobot, FaSmile,
    FaShieldAlt, FaUsers, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import {
    sendMessage,
    subscribeToMessages,
    setTypingStatus,
    subscribeToTyping,
    joinRoom,
    leaveRoom,
} from '../../../services/anonymousChatService';
import { analyzeMessage, flagMessage } from '../../../services/moderationService';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import SupportSidebar from './SupportSidebar';
import EmergencySupportModal from './EmergencySupportModal';

const AI_SUGGESTIONS = [
    { trigger: ['stressed', 'stress', 'pressure'], response: '💙 I hear you. Try the 4-7-8 breathing technique: inhale for 4 counts, hold for 7, exhale for 8. It can help calm your nervous system in minutes.' },
    { trigger: ['anxious', 'anxiety', 'nervous', 'scared'], response: '🌿 Anxiety is tough. Ground yourself with the 5-4-3-2-1 technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.' },
    { trigger: ['burnout', 'exhausted', 'tired', 'drained'], response: '✨ Burnout is real and valid. Even 10 minutes of rest without screens can help reset your mind. You deserve to rest.' },
    { trigger: ['lonely', 'alone', 'isolated'], response: '🤗 You\'re not alone — this community is here with you. Reaching out like this takes courage. We\'re glad you\'re here.' },
    { trigger: ['fail', 'failing', 'failed', 'worthless'], response: '💪 Struggling doesn\'t mean failing. Every expert was once a beginner. Your worth is not defined by your grades or performance.' },
    { trigger: ['can\'t sleep', 'insomnia', 'awake'], response: '🌙 Sleep struggles are common during stressful times. Try keeping your phone away 30 minutes before bed and doing a simple body scan meditation.' },
];

function getAISuggestion(text) {
    const lower = text.toLowerCase();
    for (const s of AI_SUGGESTIONS) {
        if (s.trigger.some((t) => lower.includes(t))) return s.response;
    }
    return null;
}

export default function AnonymousChat({ room, anonymousUser, onBack }) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [typers, setTypers] = useState([]);
    const [participantCount, setParticipantCount] = useState(0);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [emergencyLevel, setEmergencyLevel] = useState('elevated');
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const unsubMessagesRef = useRef(null);
    const unsubTypingRef = useRef(null);

    // Join room on mount
    useEffect(() => {
        if (!room || !currentUser) return;

        joinRoom(room.id, currentUser.uid);

        // Subscribe to messages
        unsubMessagesRef.current = subscribeToMessages(room.id, (msgs) => {
            setMessages(msgs);
        });

        // Subscribe to typing
        unsubTypingRef.current = subscribeToTyping(room.id, currentUser.uid, setTypers);

        // Send system join message
        sendMessage(room.id, currentUser.uid, anonymousUser.anonymousName,
            `${anonymousUser.anonymousName} joined the room`, 'system');

        return () => {
            leaveRoom(room.id);
            unsubMessagesRef.current?.();
            unsubTypingRef.current?.();
            setTypingStatus(room.id, currentUser.uid, anonymousUser.anonymousName, false);
            sendMessage(room.id, currentUser.uid, anonymousUser.anonymousName,
                `${anonymousUser.anonymousName} left the room`, 'system');
        };
    }, [room?.id, currentUser?.uid]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typers]);

    // Participant count from messages
    useEffect(() => {
        const uniqueUsers = new Set(
            messages.filter((m) => m.messageType !== 'system').map((m) => m.userId)
        );
        setParticipantCount(Math.max(uniqueUsers.size, 1));
    }, [messages]);

    const handleTyping = useCallback((value) => {
        setInput(value);

        // AI suggestion
        if (value.length > 10) {
            const suggestion = getAISuggestion(value);
            setAiSuggestion(suggestion);
        } else {
            setAiSuggestion(null);
        }

        // Typing indicator
        setTypingStatus(room.id, currentUser.uid, anonymousUser.anonymousName, true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setTypingStatus(room.id, currentUser.uid, anonymousUser.anonymousName, false);
        }, 2000);
    }, [room?.id, currentUser?.uid, anonymousUser?.anonymousName]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isSending) return;

        setIsSending(true);
        setInput('');
        setAiSuggestion(null);
        setTypingStatus(room.id, currentUser.uid, anonymousUser.anonymousName, false);

        // Analyze message for safety
        const analysis = analyzeMessage(text);

        // Send the message
        const msgId = await sendMessage(
            room.id,
            currentUser.uid,
            anonymousUser.anonymousName,
            text,
            analysis.messageType,
            analysis.stressLevel
        );

        // Flag if needed
        if (analysis.shouldFlag && msgId) {
            await flagMessage(
                room.id, msgId,
                currentUser.uid,
                anonymousUser.anonymousName,
                text,
                analysis
            );
        }

        // Show emergency modal
        if (analysis.level === 'emergency' || analysis.level === 'elevated') {
            setEmergencyLevel(analysis.level);
            setTimeout(() => setShowEmergencyModal(true), 800);
        }

        // AI auto-response for support
        if (analysis.level !== 'none' && analysis.level !== 'low') {
            const aiMsg = getAISuggestion(text);
            if (aiMsg) {
                setTimeout(async () => {
                    await sendMessage(
                        room.id,
                        'ai-assistant',
                        'Wellness AI',
                        aiMsg,
                        'ai',
                        'normal'
                    );
                }, 1200);
            }
        }

        setIsSending(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-[calc(100vh-120px)] min-h-[600px] gap-4">
            {/* Main Chat Panel */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Chat Header */}
                <div className={`flex items-center justify-between px-5 py-4 bg-gradient-to-r ${room.color} text-white`}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <FaArrowLeft className="text-sm" />
                        </button>
                        <span className="text-2xl">{room.icon}</span>
                        <div>
                            <h2 className="font-bold text-base">{room.title}</h2>
                            <div className="flex items-center gap-2 text-white/80 text-xs">
                                <FaUsers className="text-xs" />
                                <span>{participantCount} in room</span>
                                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-xl text-xs font-medium">
                            <FaShieldAlt className="text-xs" />
                            Anonymous
                        </div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors lg:hidden"
                        >
                            {sidebarOpen ? <FaTimes className="text-sm" /> : <FaUsers className="text-sm" />}
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-gray-50/50 to-white">
                    {/* Welcome banner */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-4"
                    >
                        <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${room.color} text-white text-xs font-medium rounded-full shadow-sm`}>
                            <FaShieldAlt className="text-xs" />
                            This is a safe, anonymous space. Be kind and supportive.
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isOwn={msg.userId === currentUser?.uid}
                                currentUserId={currentUser?.uid}
                                roomId={room.id}
                            />
                        ))}
                    </AnimatePresence>

                    <TypingIndicator typers={typers} />
                    <div ref={messagesEndRef} />
                </div>

                {/* AI Suggestion Banner */}
                <AnimatePresence>
                    {aiSuggestion && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-5 py-3 bg-teal-50 border-t border-teal-100"
                        >
                            <div className="flex items-start gap-2">
                                <FaRobot className="text-teal-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-teal-700 mb-0.5">Wellness AI Suggestion</p>
                                    <p className="text-xs text-teal-600">{aiSuggestion}</p>
                                </div>
                                <button onClick={() => setAiSuggestion(null)} className="text-teal-400 hover:text-teal-600">
                                    <FaTimes className="text-xs" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input Area */}
                <div className="px-5 py-4 border-t border-gray-100 bg-white">
                    <div className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => handleTyping(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Share what's on your mind… (anonymous)"
                                rows={1}
                                style={{ maxHeight: '100px', resize: 'none' }}
                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 focus:border-blue-400 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-colors"
                                onInput={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSend}
                            disabled={!input.trim() || isSending}
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-all flex-shrink-0
                                ${input.trim() && !isSending
                                    ? `bg-gradient-to-r ${room.color} text-white`
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <FaPaperPlane className="text-sm" />
                        </motion.button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        You appear as <strong className="text-gray-600">{anonymousUser?.anonymousName}</strong> · Press Enter to send
                    </p>
                </div>
            </div>

            {/* Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 'auto' }}
                        exit={{ opacity: 0, x: 20, width: 0 }}
                        className="hidden lg:block w-72 flex-shrink-0"
                    >
                        <SupportSidebar
                            room={room}
                            anonymousName={anonymousUser?.anonymousName}
                            participantCount={participantCount}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Emergency Modal */}
            <EmergencySupportModal
                isOpen={showEmergencyModal}
                onClose={() => setShowEmergencyModal(false)}
                triggerLevel={emergencyLevel}
            />
        </div>
    );
}
