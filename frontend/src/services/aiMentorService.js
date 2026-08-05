import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    doc,
    deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { analyzeStressWithLLM, saveStressAnalytics } from './stressDetectionService';

const AI_ENDPOINT = 'http://127.0.0.1:8000/chat';
const MAX_RETRIES = 2;

/**
 * Send a message to the AI Mentor FastAPI backend.
 * Retries up to MAX_RETRIES times on network failure.
 */
export async function sendMessageToAI(message, retries = 0) {
    try {
        const res = await fetch(AI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
        }

        const data = await res.json();
        return data.response;
    } catch (err) {
        if (retries < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 800 * (retries + 1)));
            return sendMessageToAI(message, retries + 1);
        }
        throw err;
    }
}

/**
 * Send message with stress analysis
 * Analyzes the message for stress indicators and returns both AI response and stress data
 */
export async function sendMessageWithStressAnalysis(userId, message, conversationHistory = []) {
    try {
        // Run AI response and stress analysis in parallel
        const [aiResponse, stressAnalysis] = await Promise.all([
            sendMessageToAI(message),
            analyzeStressWithLLM(message, userId, conversationHistory)
        ]);

        // Save stress analytics to Firestore
        if (stressAnalysis.success) {
            await saveStressAnalytics(userId, stressAnalysis);
        }

        return {
            response: aiResponse,
            stressAnalysis: stressAnalysis,
            hasStressData: stressAnalysis.success
        };
    } catch (error) {
        console.error('Error in sendMessageWithStressAnalysis:', error);
        // Fallback: return AI response without stress analysis
        const aiResponse = await sendMessageToAI(message);
        return {
            response: aiResponse,
            stressAnalysis: null,
            hasStressData: false
        };
    }
}

// ─── Firestore chat history ───────────────────────────────────────────────────

function chatHistoryRef(uid) {
    return collection(db, 'users', uid, 'aiChatHistory');
}

/**
 * Persist a single message to Firestore with stress analysis data
 */
export async function saveChatMessage(uid, message, stressData = null) {
    if (!uid) return;
    try {
        const messageData = {
            role: message.role,
            content: message.content,
            timestamp: serverTimestamp(),
        };

        // Add stress analysis data if available
        if (stressData && stressData.success) {
            messageData.stressScore = stressData.stressScore;
            messageData.stressLevel = stressData.stressLevel;
            messageData.moodScore = stressData.moodScore;
            messageData.sentiment = stressData.sentiment;
            messageData.keywords = stressData.keywords || [];
            messageData.topics = stressData.topics || [];
            messageData.urgencyLevel = stressData.urgencyLevel;
        }

        await addDoc(chatHistoryRef(uid), messageData);
    } catch (err) {
        console.error('Failed to save chat message:', err);
    }
}

/**
 * Load all chat messages for a user, ordered by timestamp.
 */
export async function loadChatHistory(uid) {
    if (!uid) return [];
    try {
        const q = query(chatHistoryRef(uid), orderBy('timestamp', 'asc'));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({
            id: d.id,
            role: d.data().role,
            content: d.data().content,
            timestamp: d.data().timestamp?.toDate?.() ?? null,
        }));
    } catch (err) {
        console.error('Failed to load chat history:', err);
        return [];
    }
}

/**
 * Delete a single message document.
 */
export async function deleteChatMessage(uid, messageId) {
    if (!uid || !messageId) return;
    try {
        await deleteDoc(doc(db, 'users', uid, 'aiChatHistory', messageId));
    } catch (err) {
        console.error('Failed to delete chat message:', err);
    }
}

/**
 * Clear all chat history for a user.
 */
export async function clearChatHistory(uid) {
    if (!uid) return;
    try {
        const snap = await getDocs(chatHistoryRef(uid));
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    } catch (err) {
        console.error('Failed to clear chat history:', err);
    }
}
