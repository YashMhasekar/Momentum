import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    where,
    limit,
    increment,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Anonymous Name Generator ─────────────────────────────────────────────────

const adjectives = [
    'Calm', 'Quiet', 'Gentle', 'Brave', 'Bright', 'Soft', 'Kind', 'Wise',
    'Still', 'Clear', 'Warm', 'Cool', 'Deep', 'Free', 'Bold', 'Swift',
    'Steady', 'Serene', 'Mindful', 'Hopeful', 'Focused', 'Peaceful', 'Curious', 'Resilient'
];

const nouns = [
    'Fox', 'Owl', 'Deer', 'Hawk', 'Wolf', 'Bear', 'Sage', 'Star',
    'Moon', 'River', 'Cloud', 'Flame', 'Stone', 'Wind', 'Soul', 'Mind',
    'Learner', 'Seeker', 'Thinker', 'Dreamer', 'Scholar', 'Wanderer', 'Explorer', 'Voyager'
];

export function generateAnonymousName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 90) + 10; // 10–99
    return `${adj}${noun}${num}`;
}

// ─── Anonymous User Management ────────────────────────────────────────────────

/**
 * Get or create an anonymous identity for a user.
 * The anonymousName is stored in Firestore but userId is kept internal.
 */
export async function getOrCreateAnonymousUser(userId) {
    if (!userId) return null;
    try {
        const ref = doc(db, 'anonymousUsers', userId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            return snap.data();
        }

        const anonymousName = generateAnonymousName();
        const userData = {
            userId,
            anonymousName,
            createdAt: serverTimestamp(),
            isVolunteer: false,
            volunteerBadge: null,
            totalMessages: 0,
            roomsJoined: [],
        };

        await setDoc(ref, userData);
        return userData;
    } catch (err) {
        console.error('Error getting/creating anonymous user:', err);
        return null;
    }
}

// ─── Support Rooms ────────────────────────────────────────────────────────────

export const SUPPORT_ROOMS = [
    {
        id: 'academic-stress',
        title: 'Academic Stress',
        description: 'Share struggles with coursework, deadlines, and academic pressure in a safe space.',
        icon: '📚',
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        supportLevel: 'Peer Support',
        tags: ['exams', 'coursework', 'deadlines'],
    },
    {
        id: 'burnout-exhaustion',
        title: 'Burnout & Exhaustion',
        description: 'Talk about feeling drained, overwhelmed, or losing motivation to continue.',
        icon: '🔥',
        color: 'from-orange-500 to-amber-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        supportLevel: 'Peer + Counselor',
        tags: ['burnout', 'fatigue', 'motivation'],
    },
    {
        id: 'placement-anxiety',
        title: 'Placement Anxiety',
        description: 'Discuss fears around placements, interviews, and career uncertainty.',
        icon: '💼',
        color: 'from-purple-500 to-violet-500',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        supportLevel: 'Peer Support',
        tags: ['placement', 'career', 'interviews'],
    },
    {
        id: 'loneliness',
        title: 'Loneliness & Isolation',
        description: 'A warm space for those feeling disconnected, lonely, or misunderstood.',
        icon: '🌙',
        color: 'from-indigo-500 to-blue-500',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        supportLevel: 'Peer + Counselor',
        tags: ['loneliness', 'connection', 'isolation'],
    },
    {
        id: 'project-pressure',
        title: 'Project Pressure',
        description: 'Get support for group project stress, team conflicts, and submission anxiety.',
        icon: '⚙️',
        color: 'from-teal-500 to-green-500',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200',
        supportLevel: 'Peer Support',
        tags: ['projects', 'teamwork', 'deadlines'],
    },
    {
        id: 'exam-stress',
        title: 'Exam Stress',
        description: 'Share exam anxiety, preparation struggles, and fear of failure.',
        icon: '📝',
        color: 'from-red-400 to-rose-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        supportLevel: 'Peer Support',
        tags: ['exams', 'anxiety', 'preparation'],
    },
    {
        id: 'motivation-support',
        title: 'Motivation Support',
        description: 'Find encouragement when you feel stuck, unmotivated, or lost in your journey.',
        icon: '⚡',
        color: 'from-yellow-500 to-amber-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        supportLevel: 'Peer Support',
        tags: ['motivation', 'goals', 'progress'],
    },
    {
        id: 'mental-wellness',
        title: 'Mental Wellness',
        description: 'Open conversations about mental health, self-care, and emotional well-being.',
        icon: '🧠',
        color: 'from-pink-500 to-rose-400',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        supportLevel: 'Counselor Available',
        tags: ['mental health', 'self-care', 'wellness'],
    },
];

/**
 * Get room metadata (participant count, last activity) from Firestore.
 */
export async function getRoomStats(roomId) {
    try {
        const ref = doc(db, 'anonymousRooms', roomId);
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data();

        // Initialize room if it doesn't exist
        const roomData = {
            roomId,
            activeParticipants: 0,
            totalMessages: 0,
            lastActivity: serverTimestamp(),
            createdAt: serverTimestamp(),
        };
        await setDoc(ref, roomData);
        return roomData;
    } catch (err) {
        console.error('Error getting room stats:', err);
        return { activeParticipants: 0, totalMessages: 0 };
    }
}

/**
 * Increment participant count when user joins a room.
 */
export async function joinRoom(roomId, userId) {
    try {
        const roomRef = doc(db, 'anonymousRooms', roomId);
        await setDoc(roomRef, {
            activeParticipants: increment(1),
            lastActivity: serverTimestamp(),
        }, { merge: true });

        // Track rooms joined for the user
        const userRef = doc(db, 'anonymousUsers', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const rooms = userSnap.data().roomsJoined || [];
            if (!rooms.includes(roomId)) {
                await updateDoc(userRef, { roomsJoined: [...rooms, roomId] });
            }
        }
    } catch (err) {
        console.error('Error joining room:', err);
    }
}

/**
 * Decrement participant count when user leaves a room.
 */
export async function leaveRoom(roomId) {
    try {
        const roomRef = doc(db, 'anonymousRooms', roomId);
        const snap = await getDoc(roomRef);
        if (snap.exists()) {
            const current = snap.data().activeParticipants || 0;
            await updateDoc(roomRef, {
                activeParticipants: Math.max(0, current - 1),
                lastActivity: serverTimestamp(),
            });
        }
    } catch (err) {
        console.error('Error leaving room:', err);
    }
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/**
 * Send a message to a support room.
 * userId is stored internally but only anonymousName is shown publicly.
 */
export async function sendMessage(roomId, userId, anonymousName, text, messageType = 'support', stressLevel = 'normal') {
    if (!roomId || !userId || !text.trim()) return null;
    try {
        const messagesRef = collection(db, 'anonymousMessages', roomId, 'messages');
        const msgDoc = await addDoc(messagesRef, {
            userId,           // internal only — never exposed in UI
            anonymousName,    // public display name
            roomId,
            message: text.trim(),
            timestamp: serverTimestamp(),
            messageType,      // 'support' | 'concern' | 'emergency' | 'ai' | 'system'
            stressLevel,      // 'normal' | 'elevated' | 'high'
            reactions: {},
            isFlagged: false,
            isDeleted: false,
        });

        // Update room stats
        await setDoc(doc(db, 'anonymousRooms', roomId), {
            totalMessages: increment(1),
            lastActivity: serverTimestamp(),
        }, { merge: true });

        // Update user message count
        await setDoc(doc(db, 'anonymousUsers', userId), {
            totalMessages: increment(1),
        }, { merge: true });

        return msgDoc.id;
    } catch (err) {
        console.error('Error sending message:', err);
        return null;
    }
}

/**
 * Real-time listener for messages in a room.
 * Returns unsubscribe function.
 */
export function subscribeToMessages(roomId, callback) {
    const messagesRef = collection(db, 'anonymousMessages', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs
            .map((d) => ({
                id: d.id,
                ...d.data(),
                timestamp: d.data().timestamp?.toDate?.() ?? new Date(),
            }))
            .filter((m) => !m.isDeleted);
        callback(messages);
    }, (err) => {
        console.error('Message listener error:', err);
    });
}

/**
 * Add an emoji reaction to a message.
 */
export async function addReaction(roomId, messageId, emoji, userId) {
    try {
        const msgRef = doc(db, 'anonymousMessages', roomId, 'messages', messageId);
        const snap = await getDoc(msgRef);
        if (!snap.exists()) return;

        const reactions = snap.data().reactions || {};
        const users = reactions[emoji] || [];

        if (users.includes(userId)) {
            // Toggle off
            reactions[emoji] = users.filter((u) => u !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
        } else {
            reactions[emoji] = [...users, userId];
        }

        await updateDoc(msgRef, { reactions });
    } catch (err) {
        console.error('Error adding reaction:', err);
    }
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

export async function setTypingStatus(roomId, userId, anonymousName, isTyping) {
    try {
        const ref = doc(db, 'anonymousRooms', roomId, 'typing', userId);
        if (isTyping) {
            await setDoc(ref, { anonymousName, timestamp: serverTimestamp() });
        } else {
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(ref);
        }
    } catch (err) {
        // Silently fail — typing indicators are non-critical
    }
}

export function subscribeToTyping(roomId, currentUserId, callback) {
    const ref = collection(db, 'anonymousRooms', roomId, 'typing');
    return onSnapshot(ref, (snap) => {
        const typers = snap.docs
            .filter((d) => d.id !== currentUserId)
            .map((d) => d.data().anonymousName);
        callback(typers);
    }, () => callback([]));
}
