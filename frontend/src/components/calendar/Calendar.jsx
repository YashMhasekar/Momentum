import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaPlus, FaSync, FaFilter, FaSearch, FaCalendarAlt,
    FaFire, FaChartLine, FaClock, FaCheckCircle, FaExclamationTriangle, FaTimes, FaGoogle
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
    subscribeToCalendarEvents,
    createCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    toggleEventCompletion,
    calculateProductivityStats,
    getEventStyle,
    eventCategories,
    priorityLevels
} from '../../services/calendarEventService';
import { getUserTasks } from '../../services/taskService';
import { createCalendarEvent as createGoogleEvent } from '../../services/calendarService';
import EventPopup from './EventPopup';
import { showSuccess, showError, showLoading, updateToast } from '../../services/toastService';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';

const localizer = momentLocalizer(moment);

function Calendar() {
    const { currentUser, userProfile } = useAuth();
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventPopup, setShowEventPopup] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [stats, setStats] = useState(null);
    const [availableTasks, setAvailableTasks] = useState([]);

    // New event form state
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        subject: '',
        start: new Date(),
        end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
        priority: 'medium',
        category: 'task',
        taskId: null,
        syncToCalendar: false,
        reminderType: [],
        location: '',
        allDay: false
    });

    // Subscribe to real-time events
    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);
        const unsubscribe = subscribeToCalendarEvents(currentUser.uid, (fetchedEvents) => {
            setEvents(fetchedEvents);
            setFilteredEvents(fetchedEvents);
            setStats(calculateProductivityStats(fetchedEvents));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Load available tasks
    useEffect(() => {
        if (currentUser) {
            loadAvailableTasks();
        }
    }, [currentUser]);

    const loadAvailableTasks = async () => {
        try {
            const tasks = await getUserTasks(currentUser.uid);
            setAvailableTasks(tasks.filter(t => !t.completed));
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    // Filter events
    useEffect(() => {
        let filtered = [...events];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(event =>
                event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                event.subject?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(event => event.category === categoryFilter);
        }

        // Priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(event => event.priority === priorityFilter);
        }

        setFilteredEvents(filtered);
    }, [events, searchTerm, categoryFilter, priorityFilter]);

    // Handle event selection
    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event);
        setShowEventPopup(true);
    }, []);

    // Handle slot selection (create new event)
    const handleSelectSlot = useCallback(({ start, end }) => {
        setNewEvent({
            ...newEvent,
            start,
            end
        });
        setShowCreateModal(true);
    }, [newEvent]);

    // Handle event drag and drop
    const handleEventDrop = async ({ event, start, end }) => {
        const toastId = showLoading('Updating event...');
        try {
            await updateCalendarEvent(event.id, { start, end });
            updateToast(toastId, 'success', '✅ Event updated!');
        } catch (error) {
            console.error('Error updating event:', error);
            updateToast(toastId, 'error', '❌ Failed to update event');
        }
    };

    // Handle event resize
    const handleEventResize = async ({ event, start, end }) => {
        const toastId = showLoading('Resizing event...');
        try {
            await updateCalendarEvent(event.id, { start, end });
            updateToast(toastId, 'success', '✅ Event resized!');
        } catch (error) {
            console.error('Error resizing event:', error);
            updateToast(toastId, 'error', '❌ Failed to resize event');
        }
    };

    // Create new event
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        const toastId = showLoading('Creating event...');

        try {
            // Create event in Firestore
            const event = await createCalendarEvent(currentUser.uid, newEvent);

            // Sync to Google Calendar if enabled
            if (newEvent.syncToCalendar && userProfile?.googleAccessToken) {
                updateToast(toastId, 'info', 'Syncing to Google Calendar...');
                try {
                    const calendarData = await createGoogleEvent(
                        userProfile.googleAccessToken,
                        {
                            title: newEvent.title,
                            description: newEvent.description,
                            subject: newEvent.subject,
                            dueDate: newEvent.start.toISOString().split('T')[0],
                            startTime: moment(newEvent.start).format('HH:mm'),
                            endTime: moment(newEvent.end).format('HH:mm'),
                            reminderType: newEvent.reminderType,
                            priority: newEvent.priority,
                            category: newEvent.category
                        }
                    );

                    await updateCalendarEvent(event.id, {
                        googleEventId: calendarData.googleEventId,
                        calendarLink: calendarData.calendarLink,
                        isCalendarSynced: true
                    });

                    updateToast(toastId, 'success', '✅ Event created and synced!');
                } catch (calendarError) {
                    console.error('Calendar sync error:', calendarError);
                    updateToast(toastId, 'warning', 'Event created but sync failed');
                }
            } else {
                updateToast(toastId, 'success', '✅ Event created!');
            }

            setShowCreateModal(false);
            setNewEvent({
                title: '',
                description: '',
                subject: '',
                start: new Date(),
                end: new Date(Date.now() + 60 * 60 * 1000),
                priority: 'medium',
                category: 'task',
                taskId: null,
                syncToCalendar: false,
                reminderType: [],
                location: '',
                allDay: false
            });
        } catch (error) {
            console.error('Error creating event:', error);
            updateToast(toastId, 'error', '❌ Failed to create event');
        }
    };

    // Update event
    const handleUpdateEvent = async (updatedEvent) => {
        const toastId = showLoading('Updating event...');
        try {
            await updateCalendarEvent(updatedEvent.id, updatedEvent);
            updateToast(toastId, 'success', '✅ Event updated!');
            setShowEventPopup(false);
        } catch (error) {
            console.error('Error updating event:', error);
            updateToast(toastId, 'error', '❌ Failed to update event');
        }
    };

    // Delete event
    const handleDeleteEvent = async (eventId) => {
        const toastId = showLoading('Deleting event...');
        try {
            await deleteCalendarEvent(eventId);
            updateToast(toastId, 'success', '✅ Event deleted!');
            setShowEventPopup(false);
        } catch (error) {
            console.error('Error deleting event:', error);
            updateToast(toastId, 'error', '❌ Failed to delete event');
        }
    };

    // Toggle event completion
    const handleToggleComplete = async (eventId, completed) => {
        const toastId = showLoading('Updating...');
        try {
            await toggleEventCompletion(eventId, completed);
            updateToast(toastId, 'success', completed ? '✅ Completed!' : '⏳ Marked incomplete');
        } catch (error) {
            console.error('Error toggling completion:', error);
            updateToast(toastId, 'error', '❌ Failed to update');
        }
    };

    // Custom toolbar
    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate('PREV');
        };

        const goToNext = () => {
            toolbar.onNavigate('NEXT');
        };

        const goToToday = () => {
            toolbar.onNavigate('TODAY');
        };

        const label = () => {
            const date = moment(toolbar.date);
            return (
                <span className="text-xl font-bold text-gray-900">
                    {date.format('MMMM YYYY')}
                </span>
            );
        };

        return (
            <div className="rbc-toolbar">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToBack}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                        >
                            Back
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all"
                        >
                            Today
                        </button>
                        <button
                            onClick={goToNext}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all"
                        >
                            Next
                        </button>
                        {label()}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toolbar.onView('month')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${toolbar.view === 'month'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => toolbar.onView('week')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${toolbar.view === 'week'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => toolbar.onView('day')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${toolbar.view === 'day'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => toolbar.onView('agenda')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${toolbar.view === 'agenda'
                                ? 'bg-gray-900 text-white'
                                : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            Agenda
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading calendar...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Productivity Calendar</h1>
                    <p className="text-gray-600">Manage your study schedule and track productivity</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all shadow-lg"
                >
                    <FaPlus />
                    Add Event
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid md:grid-cols-5 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <FaCalendarAlt className="text-2xl text-blue-600" />
                        </div>
                        <p className="text-3xl font-bold text-blue-900">{stats.todayEvents}</p>
                        <p className="text-sm text-blue-700">Today's Events</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <FaCheckCircle className="text-2xl text-green-600" />
                        </div>
                        <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
                        <p className="text-sm text-green-700">Completed</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <FaClock className="text-2xl text-orange-600" />
                        </div>
                        <p className="text-3xl font-bold text-orange-900">{stats.pending}</p>
                        <p className="text-sm text-orange-700">Pending</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <FaFire className="text-2xl text-purple-600" />
                        </div>
                        <p className="text-3xl font-bold text-purple-900">{stats.totalStudyHours}h</p>
                        <p className="text-sm text-purple-700">Study Hours</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <FaChartLine className="text-2xl text-pink-600" />
                        </div>
                        <p className="text-3xl font-bold text-pink-900">{stats.completionRate}%</p>
                        <p className="text-sm text-pink-700">Completion Rate</p>
                    </motion.div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="all">All Categories</option>
                        {Object.entries(eventCategories).map(([key, cat]) => (
                            <option key={key} value={key}>{cat.name}</option>
                        ))}
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="all">All Priorities</option>
                        {Object.entries(priorityLevels).map(([key, pri]) => (
                            <option key={key} value={key}>{pri.icon} {pri.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <BigCalendar
                    localizer={localizer}
                    events={filteredEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 700 }}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    onEventDrop={handleEventDrop}
                    onEventResize={handleEventResize}
                    selectable
                    resizable
                    popup
                    eventPropGetter={getEventStyle}
                    components={{
                        toolbar: CustomToolbar
                    }}
                />
            </div>

            {/* Event Popup */}
            {showEventPopup && selectedEvent && (
                <EventPopup
                    event={selectedEvent}
                    onClose={() => setShowEventPopup(false)}
                    onUpdate={handleUpdateEvent}
                    onDelete={handleDeleteEvent}
                    onToggleComplete={handleToggleComplete}
                    currentUser={currentUser}
                />
            )}

            {/* Create Event Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <FaTimes className="text-gray-600" />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Event Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="e.g., Study Data Structures"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="Add details..."
                                    />
                                </div>

                                {/* Date & Time */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Date & Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={moment(newEvent.start).format('YYYY-MM-DDTHH:mm')}
                                            onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date & Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={moment(newEvent.end).format('YYYY-MM-DDTHH:mm')}
                                            onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={newEvent.subject}
                                        onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="e.g., Data Structures"
                                    />
                                </div>

                                {/* Category & Priority */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={newEvent.category}
                                            onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        >
                                            {Object.entries(eventCategories).map(([key, cat]) => (
                                                <option key={key} value={key}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Priority
                                        </label>
                                        <select
                                            value={newEvent.priority}
                                            onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        >
                                            {Object.entries(priorityLevels).map(([key, pri]) => (
                                                <option key={key} value={key}>{pri.icon} {pri.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Link to Task */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Link to Existing Task (Optional)
                                    </label>
                                    <select
                                        value={newEvent.taskId || ''}
                                        onChange={(e) => setNewEvent({ ...newEvent, taskId: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    >
                                        <option value="">No task linked</option>
                                        {availableTasks.map(task => (
                                            <option key={task.id} value={task.id}>
                                                {task.title} - {task.category}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Link this calendar event to an existing task from your task list
                                    </p>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        placeholder="e.g., Library, Room 301"
                                    />
                                </div>

                                {/* Google Calendar Sync */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <label className="flex items-center space-x-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newEvent.syncToCalendar}
                                            onChange={(e) => setNewEvent({ ...newEvent, syncToCalendar: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="flex items-center space-x-2">
                                            <FaGoogle className="text-blue-600" />
                                            <span className="text-sm font-medium text-gray-900">Sync to Google Calendar</span>
                                        </div>
                                    </label>
                                    <p className="text-xs text-gray-600 mt-2 ml-8">
                                        Automatically add this event to your Google Calendar
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all"
                                    >
                                        Create Event
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Calendar;
