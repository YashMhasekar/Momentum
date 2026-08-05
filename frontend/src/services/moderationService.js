import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where,
    limit,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Keyword Lists ────────────────────────────────────────────────────────────

const EMERGENCY_KEYWORDS = [
    'kill myself', 'end my life', 'want to die', 'suicide', 'suicidal',
    'hurt myself', 'self harm', 'self-harm', 'cut myself', 'overdose',
    'no reason to live', 'better off dead', 'end it all', 'not worth living',
    'want to disappear forever', 'goodbye forever',
];

const HIGH_STRESS_KEYWORDS = [
    'can\'t take it anymore', 'breaking down', 'falling apart', 'losing my mind',
    'completely lost', 'hopeless', 'worthless', 'nobody cares', 'all alone',
    'panic attack', 'can\'t breathe', 'overwhelmed', 'giving up', 'failed everything',
    'hate myself', 'useless', 'disaster', 'ruined everything',
];

const CONCERN_KEYWORDS = [
    'stressed', 'anxious', 'worried', 'scared', 'nervous', 'depressed',
    'sad', 'crying', 'exhausted', 'burned out', 'can\'t sleep', 'not eating',
    'failing', 'struggling', 'difficult', 'hard time', 'pressure',
];

const BULLYING_KEYWORDS = [
    'bully', 'bullying', 'harass', 'harassment', 'threatening', 'abuse',
    'abusive', 'toxic', 'manipulate', 'manipulating',
];

// ─── Message Analysis ─────────────────────────────────────────────────────────

/**
 * Analyze a message for safety concerns.
 * Returns { level, type, shouldFlag, suggestCounselor, keywords }
 */
export function analyzeMessage(text) {
    const lower = text.toLowerCase();

    const foundEmergency = EMERGENCY_KEYWORDS.filter((kw) => lower.includes(kw));
    const foundHighStress = HIGH_STRESS_KEYWORDS.filter((kw) => lower.includes(kw));
    const foundConcern = CONCERN_KEYWORDS.filter((kw) => lower.includes(kw));
    const foundBullying = BULLYING_KEYWORDS.filter((kw) => lower.includes(kw));

    if (foundEmergency.length > 0) {
        return {
            level: 'emergency',
            type: 'self-harm',
            shouldFlag: true,
            suggestCounselor: true,
            messageType: 'emergency',
            stressLevel: 'high',
            keywords: foundEmergency,
        };
    }

    if (foundBullying.length > 0) {
        return {
            level: 'high',
            type: 'bullying',
            shouldFlag: true,
            suggestCounselor: true,
            messageType: 'concern',
            stressLevel: 'high',
            keywords: foundBullying,
        };
    }

    if (foundHighStress.length >= 2) {
        return {
            level: 'elevated',
            type: 'high-stress',
            shouldFlag: true,
            suggestCounselor: true,
            messageType: 'concern',
            stressLevel: 'elevated',
            keywords: foundHighStress,
        };
    }

    if (foundHighStress.length === 1 || foundConcern.length >= 3) {
        return {
            level: 'moderate',
            type: 'stress',
            shouldFlag: false,
            suggestCounselor: false,
            messageType: 'concern',
            stressLevel: 'elevated',
            keywords: [...foundHighStress, ...foundConcern],
        };
    }

    if (foundConcern.length > 0) {
        return {
            level: 'low',
            type: 'general',
            shouldFlag: false,
            suggestCounselor: false,
            messageType: 'support',
            stressLevel: 'normal',
            keywords: foundConcern,
        };
    }

    return {
        level: 'none',
        type: 'normal',
        shouldFlag: false,
        suggestCounselor: false,
        messageType: 'support',
        stressLevel: 'normal',
        keywords: [],
    };
}

// ─── Flag Management ──────────────────────────────────────────────────────────

/**
 * Create a support flag for admin review.
 */
export async function createSupportFlag(data) {
    try {
        await addDoc(collection(db, 'supportFlags'), {
            ...data,
            createdAt: serverTimestamp(),
            resolved: false,
            resolvedBy: null,
            resolvedAt: null,
            adminNotes: '',
        });
    } catch (err) {
        console.error('Error creating support flag:', err);
    }
}

/**
 * Flag a message in Firestore and create an admin alert.
 */
export async function flagMessage(roomId, messageId, userId, anonymousName, messageText, analysisResult) {
    try {
        // Update the message document
        const { doc: firestoreDoc, updateDoc: firestoreUpdate } = await import('firebase/firestore');
        const msgRef = firestoreDoc(db, 'anonymousMessages', roomId, 'messages', messageId);
        await firestoreUpdate(msgRef, {
            isFlagged: true,
            flagReason: analysisResult.type,
            flagLevel: analysisResult.level,
        });

        // Create admin alert
        await createSupportFlag({
            messageId,
            roomId,
            userId,           // internal — admin can see real identity
            anonymousName,    // what others see
            messageText,
            flagReason: analysisResult.type,
            flagLevel: analysisResult.level,
            keywords: analysisResult.keywords,
        });
    } catch (err) {
        console.error('Error flagging message:', err);
    }
}

/**
 * Resolve a flag (admin action).
 */
export async function resolveFlag(flagId, adminId, notes = '') {
    try {
        await updateDoc(doc(db, 'supportFlags', flagId), {
            resolved: true,
            resolvedBy: adminId,
            resolvedAt: serverTimestamp(),
            adminNotes: notes,
        });
    } catch (err) {
        console.error('Error resolving flag:', err);
    }
}

/**
 * Real-time listener for admin flags.
 */
export function subscribeToFlags(callback, resolvedFilter = false) {
    const q = query(
        collection(db, 'supportFlags'),
        where('resolved', '==', resolvedFilter),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, (snap) => {
        const flags = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        }));
        callback(flags);
    }, (err) => {
        console.error('Flags listener error:', err);
    });
}

/**
 * Get support statistics for admin dashboard.
 */
export async function getSupportStats() {
    try {
        const [flagsSnap, roomsSnap, usersSnap] = await Promise.all([
            getDocs(collection(db, 'supportFlags')),
            getDocs(collection(db, 'anonymousRooms')),
            getDocs(collection(db, 'anonymousUsers')),
        ]);

        const flags = flagsSnap.docs.map((d) => d.data());
        const unresolvedFlags = flags.filter((f) => !f.resolved);
        const emergencyFlags = flags.filter((f) => f.flagLevel === 'emergency' && !f.resolved);

        const totalParticipants = roomsSnap.docs.reduce(
            (sum, d) => sum + (d.data().activeParticipants || 0), 0
        );

        return {
            totalFlags: flags.length,
            unresolvedFlags: unresolvedFlags.length,
            emergencyAlerts: emergencyFlags.length,
            activeRooms: roomsSnap.size,
            totalUsers: usersSnap.size,
            totalParticipants,
        };
    } catch (err) {
        console.error('Error getting support stats:', err);
        return { totalFlags: 0, unresolvedFlags: 0, emergencyAlerts: 0, activeRooms: 0, totalUsers: 0, totalParticipants: 0 };
    }
}
