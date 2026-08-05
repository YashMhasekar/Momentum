/**
 * Google Calendar Integration Service
 * Handles all Google Calendar API operations
 */

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_ID = 'primary';

/**
 * Initialize Google Calendar API with access token
 */
export const initializeCalendarAPI = (accessToken) => {
    if (!accessToken) {
        throw new Error('Access token is required');
    }
    return accessToken;
};

/**
 * Create a Google Calendar event from task data
 * @param {string} accessToken - Google OAuth access token
 * @param {object} taskData - Task information
 * @returns {Promise<object>} Created event data
 */
export const createCalendarEvent = async (accessToken, taskData) => {
    try {
        const {
            title,
            description,
            subject,
            dueDate,
            startTime,
            endTime,
            reminderType = [],
            priority,
            category
        } = taskData;

        // Parse date and time
        const taskDate = new Date(dueDate);
        const [startHour, startMinute] = (startTime || '09:00').split(':');
        const [endHour, endMinute] = (endTime || '10:00').split(':');

        const startDateTime = new Date(taskDate);
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0);

        const endDateTime = new Date(taskDate);
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

        // Build reminders array
        const reminders = {
            useDefault: false,
            overrides: []
        };

        if (reminderType.includes('10min')) {
            reminders.overrides.push({ method: 'popup', minutes: 10 });
        }
        if (reminderType.includes('30min')) {
            reminders.overrides.push({ method: 'popup', minutes: 30 });
        }
        if (reminderType.includes('1hour')) {
            reminders.overrides.push({ method: 'popup', minutes: 60 });
        }
        if (reminderType.includes('1day')) {
            reminders.overrides.push({ method: 'popup', minutes: 1440 });
        }
        if (reminderType.includes('email')) {
            reminders.overrides.push({ method: 'email', minutes: 60 });
        }

        // If no reminders selected, use default
        if (reminders.overrides.length === 0) {
            reminders.useDefault = true;
        }

        // Build event object
        const event = {
            summary: `📚 ${title}`,
            description: `${description}\n\n📖 Subject: ${subject || 'General'}\n⚡ Priority: ${priority}\n📂 Category: ${category}`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            reminders: reminders,
            colorId: getPriorityColorId(priority)
        };

        // Make API request
        const response = await fetch(
            `${CALENDAR_API_BASE}/calendars/${CALENDAR_ID}/events`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create calendar event');
        }

        const createdEvent = await response.json();

        return {
            googleEventId: createdEvent.id,
            calendarLink: createdEvent.htmlLink,
            success: true
        };
    } catch (error) {
        console.error('Error creating calendar event:', error);
        throw error;
    }
};

/**
 * Update an existing Google Calendar event
 * @param {string} accessToken - Google OAuth access token
 * @param {string} eventId - Google Calendar event ID
 * @param {object} taskData - Updated task information
 * @returns {Promise<object>} Updated event data
 */
export const updateCalendarEvent = async (accessToken, eventId, taskData) => {
    try {
        const {
            title,
            description,
            subject,
            dueDate,
            startTime,
            endTime,
            reminderType = [],
            priority,
            category,
            completed
        } = taskData;

        // Parse date and time
        const taskDate = new Date(dueDate);
        const [startHour, startMinute] = (startTime || '09:00').split(':');
        const [endHour, endMinute] = (endTime || '10:00').split(':');

        const startDateTime = new Date(taskDate);
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0);

        const endDateTime = new Date(taskDate);
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

        // Build reminders array
        const reminders = {
            useDefault: false,
            overrides: []
        };

        if (reminderType.includes('10min')) {
            reminders.overrides.push({ method: 'popup', minutes: 10 });
        }
        if (reminderType.includes('30min')) {
            reminders.overrides.push({ method: 'popup', minutes: 30 });
        }
        if (reminderType.includes('1hour')) {
            reminders.overrides.push({ method: 'popup', minutes: 60 });
        }
        if (reminderType.includes('1day')) {
            reminders.overrides.push({ method: 'popup', minutes: 1440 });
        }
        if (reminderType.includes('email')) {
            reminders.overrides.push({ method: 'email', minutes: 60 });
        }

        if (reminders.overrides.length === 0) {
            reminders.useDefault = true;
        }

        // Build event object
        const event = {
            summary: completed ? `✅ ${title}` : `📚 ${title}`,
            description: `${description}\n\n📖 Subject: ${subject || 'General'}\n⚡ Priority: ${priority}\n📂 Category: ${category}\n${completed ? '✅ Status: Completed' : '⏳ Status: Pending'}`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            reminders: reminders,
            colorId: completed ? '10' : getPriorityColorId(priority) // Green for completed
        };

        // Make API request
        const response = await fetch(
            `${CALENDAR_API_BASE}/calendars/${CALENDAR_ID}/events/${eventId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to update calendar event');
        }

        const updatedEvent = await response.json();

        return {
            googleEventId: updatedEvent.id,
            calendarLink: updatedEvent.htmlLink,
            success: true
        };
    } catch (error) {
        console.error('Error updating calendar event:', error);
        throw error;
    }
};

/**
 * Delete a Google Calendar event
 * @param {string} accessToken - Google OAuth access token
 * @param {string} eventId - Google Calendar event ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteCalendarEvent = async (accessToken, eventId) => {
    try {
        const response = await fetch(
            `${CALENDAR_API_BASE}/calendars/${CALENDAR_ID}/events/${eventId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            }
        );

        if (!response.ok && response.status !== 404) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to delete calendar event');
        }

        return true;
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        // Don't throw error if event doesn't exist
        if (error.message.includes('404')) {
            return true;
        }
        throw error;
    }
};

/**
 * Get priority color ID for Google Calendar
 * @param {string} priority - Task priority level
 * @returns {string} Google Calendar color ID
 */
const getPriorityColorId = (priority) => {
    const colorMap = {
        high: '11',    // Red
        medium: '5',   // Yellow
        low: '2'       // Green
    };
    return colorMap[priority] || '9'; // Default blue
};

/**
 * Validate Google Calendar access token
 * @param {string} accessToken - Google OAuth access token
 * @returns {Promise<boolean>} Token validity
 */
export const validateAccessToken = async (accessToken) => {
    try {
        const response = await fetch(
            `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
        );

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.expires_in > 0;
    } catch (error) {
        console.error('Error validating access token:', error);
        return false;
    }
};

/**
 * Refresh Google access token using refresh token
 * @param {string} refreshToken - Google OAuth refresh token
 * @returns {Promise<string>} New access token
 */
export const refreshAccessToken = async (refreshToken) => {
    try {
        // This would typically be done through your backend
        // For security, refresh tokens should not be exposed to frontend
        console.warn('Token refresh should be handled by backend');
        throw new Error('Token refresh not implemented');
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
};

/**
 * Create recurring calendar events
 * @param {string} accessToken - Google OAuth access token
 * @param {object} taskData - Task information with recurring settings
 * @returns {Promise<object>} Created event data
 */
export const createRecurringCalendarEvent = async (accessToken, taskData) => {
    try {
        const {
            title,
            description,
            subject,
            dueDate,
            startTime,
            endTime,
            reminderType = [],
            priority,
            category,
            recurringType
        } = taskData;

        // Parse date and time
        const taskDate = new Date(dueDate);
        const [startHour, startMinute] = (startTime || '09:00').split(':');
        const [endHour, endMinute] = (endTime || '10:00').split(':');

        const startDateTime = new Date(taskDate);
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0);

        const endDateTime = new Date(taskDate);
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

        // Build recurrence rule
        let recurrence = [];
        switch (recurringType) {
            case 'daily':
                recurrence = ['RRULE:FREQ=DAILY'];
                break;
            case 'weekdays':
                recurrence = ['RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'];
                break;
            case 'weekly':
                recurrence = ['RRULE:FREQ=WEEKLY'];
                break;
            default:
                recurrence = [];
        }

        // Build reminders
        const reminders = {
            useDefault: false,
            overrides: []
        };

        if (reminderType.includes('10min')) {
            reminders.overrides.push({ method: 'popup', minutes: 10 });
        }
        if (reminderType.includes('30min')) {
            reminders.overrides.push({ method: 'popup', minutes: 30 });
        }
        if (reminderType.includes('1hour')) {
            reminders.overrides.push({ method: 'popup', minutes: 60 });
        }
        if (reminderType.includes('1day')) {
            reminders.overrides.push({ method: 'popup', minutes: 1440 });
        }
        if (reminderType.includes('email')) {
            reminders.overrides.push({ method: 'email', minutes: 60 });
        }

        if (reminders.overrides.length === 0) {
            reminders.useDefault = true;
        }

        // Build event object
        const event = {
            summary: `📚 ${title}`,
            description: `${description}\n\n📖 Subject: ${subject || 'General'}\n⚡ Priority: ${priority}\n📂 Category: ${category}\n🔄 Recurring: ${recurringType}`,
            start: {
                dateTime: startDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            end: {
                dateTime: endDateTime.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            recurrence: recurrence,
            reminders: reminders,
            colorId: getPriorityColorId(priority)
        };

        // Make API request
        const response = await fetch(
            `${CALENDAR_API_BASE}/calendars/${CALENDAR_ID}/events`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create recurring calendar event');
        }

        const createdEvent = await response.json();

        return {
            googleEventId: createdEvent.id,
            calendarLink: createdEvent.htmlLink,
            success: true
        };
    } catch (error) {
        console.error('Error creating recurring calendar event:', error);
        throw error;
    }
};
