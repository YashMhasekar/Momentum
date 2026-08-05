import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaCheck, FaTrash, FaEdit, FaClock, FaFlag,
    FaCalendar, FaGoogle, FaBell, FaBook, FaMapMarkerAlt,
    FaStickyNote, FaRedo
} from 'react-icons/fa';
import { eventCategories, priorityLevels } from '../../services/calendarEventService';
import { getUserTasks } from '../../services/taskService';

function EventPopup({ event, onClose, onUpdate, onDelete, onToggleComplete, currentUser }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedEvent, setEditedEvent] = useState(event || {});
    const [availableTasks, setAvailableTasks] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const handleSave = async () => {
        try {
            setLoading(true);
            await onUpdate(editedEvent);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                setLoading(true);
                await onDelete(event.id);
                onClose();
            } catch (error) {
                console.error('Error deleting event:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleToggleComplete = async () => {
        try {
            setLoading(true);
            await onToggleComplete(event.id, !event.completed);
        } catch (error) {
            console.error('Error toggling completion:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDuration = () => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const diff = (end - start) / (1000 * 60); // minutes

        if (diff < 60) {
            return `${Math.round(diff)} minutes`;
        } else {
            const hours = Math.floor(diff / 60);
            const mins = Math.round(diff % 60);
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    };

    const isOverdue = !event.completed && new Date(event.end) < new Date();
    const category = eventCategories[event.category] || eventCategories.task;
    const priority = priorityLevels[event.priority] || priorityLevels.medium;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className="px-6 py-4 border-b border-gray-200"
                        style={{
                            background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`
                        }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editedEvent.title}
                                        onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                                        className="text-2xl font-bold text-gray-900 w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-1"
                                        placeholder="Event title"
                                    />
                                ) : (
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        {event.title}
                                        {event.completed && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <FaCheck className="mr-1" /> Completed
                                            </span>
                                        )}
                                        {isOverdue && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                ⚠️ Overdue
                                            </span>
                                        )}
                                    </h2>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                    <span
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: category.bgColor,
                                            color: category.color
                                        }}
                                    >
                                        {category.name}
                                    </span>
                                    <span
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: `${priority.color}20`,
                                            color: priority.color
                                        }}
                                    >
                                        <FaFlag className="text-xs" />
                                        {priority.name} Priority
                                    </span>
                                    {event.isCalendarSynced && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                            <FaGoogle className="text-xs" />
                                            Synced
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FaTimes className="text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
                        <div className="space-y-4">
                            {/* Date & Time */}
                            <div className="flex items-start gap-3">
                                <FaClock className="text-gray-400 mt-1" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">Date & Time</p>
                                    {isEditing ? (
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <input
                                                type="datetime-local"
                                                value={new Date(editedEvent.start).toISOString().slice(0, 16)}
                                                onChange={(e) => setEditedEvent({ ...editedEvent, start: new Date(e.target.value) })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                            <input
                                                type="datetime-local"
                                                value={new Date(editedEvent.end).toISOString().slice(0, 16)}
                                                onChange={(e) => setEditedEvent({ ...editedEvent, end: new Date(e.target.value) })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-600 mt-1">
                                                <strong>Start:</strong> {formatDate(event.start)}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                <strong>End:</strong> {formatDate(event.end)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Duration: {getDuration()}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Subject */}
                            {(event.subject || isEditing) && (
                                <div className="flex items-start gap-3">
                                    <FaBook className="text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Subject</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedEvent.subject || ''}
                                                onChange={(e) => setEditedEvent({ ...editedEvent, subject: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                                                placeholder="e.g., Data Structures"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-600 mt-1">{event.subject}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {(event.description || isEditing) && (
                                <div className="flex items-start gap-3">
                                    <FaStickyNote className="text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Description</p>
                                        {isEditing ? (
                                            <textarea
                                                value={editedEvent.description || ''}
                                                onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
                                                rows="3"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                                                placeholder="Add details..."
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{event.description}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Link to Task */}
                            {isEditing && (
                                <div className="flex items-start gap-3">
                                    <FaCalendar className="text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Link to Task</p>
                                        <select
                                            value={editedEvent.taskId || ''}
                                            onChange={(e) => setEditedEvent({ ...editedEvent, taskId: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                                        >
                                            <option value="">No task linked</option>
                                            {availableTasks.map(task => (
                                                <option key={task.id} value={task.id}>
                                                    {task.title} - {task.category}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Link this calendar event to an existing task
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Category & Priority */}
                            {isEditing && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={editedEvent.category}
                                            onChange={(e) => setEditedEvent({ ...editedEvent, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            {Object.entries(eventCategories).map(([key, cat]) => (
                                                <option key={key} value={key}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Priority
                                        </label>
                                        <select
                                            value={editedEvent.priority}
                                            onChange={(e) => setEditedEvent({ ...editedEvent, priority: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        >
                                            {Object.entries(priorityLevels).map(([key, pri]) => (
                                                <option key={key} value={key}>{pri.icon} {pri.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Reminders */}
                            {event.reminderType && event.reminderType.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <FaBell className="text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Reminders</p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {event.reminderType.map((reminder, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium"
                                                >
                                                    {reminder}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            {(event.location || isEditing) && (
                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Location</p>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedEvent.location || ''}
                                                onChange={(e) => setEditedEvent({ ...editedEvent, location: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-1"
                                                placeholder="e.g., Library, Room 301"
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Recurring */}
                            {event.recurring && (
                                <div className="flex items-start gap-3">
                                    <FaRedo className="text-gray-400 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700">Recurring</p>
                                        <p className="text-sm text-gray-600 mt-1 capitalize">{event.recurringType}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {!isEditing && (
                                <>
                                    <button
                                        onClick={handleToggleComplete}
                                        disabled={loading}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${event.completed
                                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        <FaCheck />
                                        {event.completed ? 'Mark Incomplete' : 'Mark Complete'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                                    >
                                        <FaEdit />
                                        Edit
                                    </button>
                                </>
                            )}
                            {isEditing && (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all"
                                    >
                                        <FaCheck />
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditedEvent(event);
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
                        >
                            <FaTrash />
                            Delete
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default EventPopup;
