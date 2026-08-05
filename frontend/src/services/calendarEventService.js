import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Calendar Event Service
 * Manages calendar events with Firebase integration
 */

// Event Categories with Colors
export const eventCategories = {
    task: { name: 'Task', color: '#3b82f6', bgColor: '#dbeafe' },
    study: { name: 'Study Session', color: '#8b5cf6', bgColor: '#ede9fe' },
    exam: { name: 'Exam', color: '#dc2626', bgColor: '#fee2e2' },
    assignment: { name: 'Assignment', color: '#f59e0b', bgColor: '#fef3c7' },
    focus: { name: 'Focus Session', color: '#7c3aed', bgColor: '#f3e8ff' },
    meeting: { name: 'Meeting', color: '#06b6d4', bgColor: '#cffafe' },
    deadline: { name: 'Deadline', color: '#ef4444', bgColor: '#fee2e2' },
    revision: { name: 'Revision', color: '#10b981', bgColor: '#d1fae5' }
};

// Priority Levels
export const priorityLevels = {
    high: { name: 'High', color: '#dc2626', icon: '🔴' },
    medium: { name: 'Medium', color: '#f59e0b', icon: '🟡' },
    low: { name: 'Low', color: '#3b82f6', icon: '🔵' }
};

/**
 * Create a new calendar event
 */
export const createCalendarEvent = async (userId, eventData) => {
    try {
        const eventsRef = collection(db, 'calendarEvents');
        const newEvent = {
            userId,
            title: eventData.title,
            description: eventData.description || '',
            subject: eventData.subject || '',
            start: Timestamp.fromDate(new Date(eventData.start)),
            end: Timestamp.fromDate(new Date(eventData.end)),
            priority: eventData.priority || 'medium',
            category: eventData.category || 'task',
            completed: false,
            taskId: eventData.taskId || null,
            googleEventId: eventData.googleEventId || null,
            isCalendarSynced: eventData.isCalendarSynced || false,
            reminderType: eventData.reminderType || [],
            allDay: eventData.allDay || false,
            recurring: eventData.recurring || false,
            recurringType: eventData.recurringType || 'none',
            location: eventData.location || '',
            attendees: eventData.attendees || [],
            notes: eventData.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(eventsRef, newEvent);
        return { id: docRef.id, ...newEvent };
    } catch (error) {
        console.error('Error creating calendar event:', error);
        throw error;
    }
};

/**
 * Get all calendar events for a user
 */
export const getUserCalendarEvents = async (userId) => {
    try {
        const eventsRef = collection(db, 'calendarEvents');
        const q = query(
            eventsRef,
            where('userId', '==', userId),
            orderBy('start', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const events = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                ...data,
                start: data.start?.toDate(),
                end: data.end?.toDate(),
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            });
        });

        return events;
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
};

/**
 * Subscribe to real-time calendar events
 */
export const subscribeToCalendarEvents = (userId, callback) => {
    try {
        const eventsRef = collection(db, 'calendarEvents');
        const q = query(
            eventsRef,
            where('userId', '==', userId),
            orderBy('start', 'asc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const events = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                events.push({
                    id: doc.id,
                    ...data,
                    start: data.start?.toDate(),
                    end: data.end?.toDate(),
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate()
                });
            });
            callback(events);
        });

        return unsubscribe;
    } catch (error) {
        console.error('Error subscribing to calendar events:', error);
        throw error;
    }
};

/**
 * Update a calendar event
 */
export const updateCalendarEvent = async (eventId, updates) => {
    try {
        const eventRef = doc(db, 'calendarEvents', eventId);

        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };

        // Convert dates to Timestamps if present
        if (updates.start) {
            updateData.start = Timestamp.fromDate(new Date(updates.start));
        }
        if (updates.end) {
            updateData.end = Timestamp.fromDate(new Date(updates.end));
        }

        await updateDoc(eventRef, updateData);
        return true;
    } catch (error) {
        console.error('Error updating calendar event:', error);
        throw error;
    }
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId) => {
    try {
        const eventRef = doc(db, 'calendarEvents', eventId);
        await deleteDoc(eventRef);
        return true;
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
    }
};

/**
 * Toggle event completion
 */
export const toggleEventCompletion = async (eventId, completed) => {
    try {
        const eventRef = doc(db, 'calendarEvents', eventId);
        await updateDoc(eventRef, {
            completed,
            completedAt: completed ? serverTimestamp() : null,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error toggling event completion:', error);
        throw error;
    }
};

/**
 * Get events for a specific date range
 */
export const getEventsInRange = async (userId, startDate, endDate) => {
    try {
        const eventsRef = collection(db, 'calendarEvents');
        const q = query(
            eventsRef,
            where('userId', '==', userId),
            where('start', '>=', Timestamp.fromDate(startDate)),
            where('start', '<=', Timestamp.fromDate(endDate)),
            orderBy('start', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const events = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                ...data,
                start: data.start?.toDate(),
                end: data.end?.toDate()
            });
        });

        return events;
    } catch (error) {
        console.error('Error fetching events in range:', error);
        throw error;
    }
};

/**
 * Get today's events
 */
export const getTodayEvents = async (userId) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return await getEventsInRange(userId, today, tomorrow);
    } catch (error) {
        console.error('Error fetching today events:', error);
        throw error;
    }
};

/**
 * Get upcoming events (next 7 days)
 */
export const getUpcomingEvents = async (userId, days = 7) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);

        return await getEventsInRange(userId, today, futureDate);
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        throw error;
    }
};

/**
 * Get overdue events
 */
export const getOverdueEvents = async (userId) => {
    try {
        const now = new Date();
        const eventsRef = collection(db, 'calendarEvents');
        const q = query(
            eventsRef,
            where('userId', '==', userId),
            where('completed', '==', false),
            where('end', '<', Timestamp.fromDate(now)),
            orderBy('end', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const events = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            events.push({
                id: doc.id,
                ...data,
                start: data.start?.toDate(),
                end: data.end?.toDate()
            });
        });

        return events;
    } catch (error) {
        console.error('Error fetching overdue events:', error);
        throw error;
    }
};

/**
 * Calculate productivity stats
 */
export const calculateProductivityStats = (events) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats = {
        total: events.length,
        completed: events.filter(e => e.completed).length,
        pending: events.filter(e => !e.completed && e.end >= now).length,
        overdue: events.filter(e => !e.completed && e.end < now).length,
        todayEvents: events.filter(e => {
            const eventDate = new Date(e.start);
            return eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }).length,
        completionRate: 0,
        totalStudyHours: 0,
        focusSessionsCompleted: 0
    };

    if (stats.total > 0) {
        stats.completionRate = Math.round((stats.completed / stats.total) * 100);
    }

    // Calculate study hours
    events.forEach(event => {
        if (event.completed && (event.category === 'study' || event.category === 'focus')) {
            const duration = (event.end - event.start) / (1000 * 60 * 60); // hours
            stats.totalStudyHours += duration;
            if (event.category === 'focus') {
                stats.focusSessionsCompleted++;
            }
        }
    });

    stats.totalStudyHours = Math.round(stats.totalStudyHours * 10) / 10;

    return stats;
};

/**
 * Get event style based on priority and category
 */
export const getEventStyle = (event) => {
    const category = eventCategories[event.category] || eventCategories.task;
    const priority = priorityLevels[event.priority] || priorityLevels.medium;

    let backgroundColor = category.color;
    let borderColor = category.color;

    // Completed events are green
    if (event.completed) {
        backgroundColor = '#10b981';
        borderColor = '#059669';
    }
    // Overdue events are red
    else if (!event.completed && event.end < new Date()) {
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
    }
    // High priority events
    else if (event.priority === 'high') {
        backgroundColor = priority.color;
        borderColor = '#b91c1c';
    }

    return {
        style: {
            backgroundColor,
            borderColor,
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: '6px',
            opacity: event.completed ? 0.7 : 1,
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '500',
            padding: '4px 8px'
        }
    };
};

export default {
    createCalendarEvent,
    getUserCalendarEvents,
    subscribeToCalendarEvents,
    updateCalendarEvent,
    deleteCalendarEvent,
    toggleEventCompletion,
    getEventsInRange,
    getTodayEvents,
    getUpcomingEvents,
    getOverdueEvents,
    calculateProductivityStats,
    getEventStyle,
    eventCategories,
    priorityLevels
};
