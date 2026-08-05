import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendar, FaPlus, FaTrash, FaClock, FaBrain, FaChartLine, FaSpinner, FaHistory, FaEye, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { savePlanner, getUserPlanners, deletePlanner } from '../../services/plannerService';
import Toast from '../Toast';

const SmartPlanner = () => {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([
        { id: 1, name: '', priority: 'Medium', difficulty: 'Medium' }
    ]);
    const [inputMode, setInputMode] = useState('days');
    const [totalDays, setTotalDays] = useState(7);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dailyHours, setDailyHours] = useState(4);
    const [breakDuration, setBreakDuration] = useState(15);
    const [preferredTime, setPreferredTime] = useState('Morning');
    const [timetable, setTimetable] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [savedPlanners, setSavedPlanners] = useState([]);
    const [loadingPlanners, setLoadingPlanners] = useState(true);
    const [selectedPlanner, setSelectedPlanner] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const timetableRef = useRef(null);

    // Load saved planners on mount
    useEffect(() => {
        if (currentUser) {
            loadSavedPlanners();
        }
    }, [currentUser]);

    const loadSavedPlanners = async () => {
        try {
            setLoadingPlanners(true);
            const planners = await getUserPlanners(currentUser.uid, 20);
            setSavedPlanners(planners);
        } catch (error) {
            console.error('Error loading saved planners:', error);
        } finally {
            setLoadingPlanners(false);
        }
    };

    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
    };

    const closeToast = () => {
        setToast({ show: false, message: '', type: 'info' });
    };

    const handleViewPlanner = (planner) => {
        setSelectedPlanner(planner);
        setTimetable(planner.timetable);
        setStats(planner.stats);
        setShowHistory(false);
        
        // Scroll to timetable
        setTimeout(() => {
            if (timetableRef.current) {
                timetableRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 300);
    };

    const handleDeletePlanner = async (plannerId) => {
        if (!window.confirm('Are you sure you want to delete this planner?')) {
            return;
        }

        try {
            await deletePlanner(plannerId);
            showToast('Planner deleted successfully', 'success');
            loadSavedPlanners();
            
            // Clear current view if deleted planner was selected
            if (selectedPlanner?.id === plannerId) {
                setSelectedPlanner(null);
                setTimetable(null);
                setStats(null);
            }
        } catch (error) {
            console.error('Error deleting planner:', error);
            showToast('Failed to delete planner', 'error');
        }
    };

    // Add task
    const addTask = () => {
        setTasks([...tasks, {
            id: Date.now(),
            name: '',
            priority: 'Medium',
            difficulty: 'Medium'
        }]);
        showToast('Task added successfully', 'success');
    };

    // Remove task
    const removeTask = (id) => {
        if (tasks.length > 1) {
            setTasks(tasks.filter(task => task.id !== id));
            showToast('Task removed', 'info');
        }
    };

    // Update task
    const updateTask = (id, field, value) => {
        setTasks(tasks.map(task =>
            task.id === id ? { ...task, [field]: value } : task
        ));
    };

    // Calculate days from date range
    const calculateDaysFromRange = () => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    };

    // Get total days based on input mode
    const getTotalDays = () => {
        if (inputMode === 'days') {
            return parseInt(totalDays) || 0;
        } else {
            return calculateDaysFromRange();
        }
    };

    // Validate inputs
    const validateInputs = () => {
        const validTasks = tasks.filter(t => t.name.trim() !== '');

        if (validTasks.length === 0) {
            showToast('Please add at least one task', 'error');
            return false;
        }

        const days = getTotalDays();
        if (days <= 0) {
            showToast('Please provide valid days or date range', 'error');
            return false;
        }

        if (dailyHours <= 0 || dailyHours > 24) {
            showToast('Daily hours must be between 1 and 24', 'error');
            return false;
        }

        if (breakDuration < 0 || breakDuration > 60) {
            showToast('Break duration must be between 0 and 60 minutes', 'error');
            return false;
        }

        return true;
    };

    // Generate time slots
    const generateTimeSlots = (startHour, totalHours, breakMinutes) => {
        const slots = [];
        let currentMinutes = startHour * 60;

        for (let i = 0; i < totalHours; i++) {
            const startTime = formatTimeFromMinutes(currentMinutes);
            currentMinutes += 60;
            const endTime = formatTimeFromMinutes(currentMinutes);

            const timeSlot = `${startTime} - ${endTime}`;
            slots.push(timeSlot);

            if (i < totalHours - 1) {
                currentMinutes += parseInt(breakMinutes);
            }
        }

        return slots;
    };

    // Format time from minutes
    const formatTimeFromMinutes = (totalMinutes) => {
        let hours = Math.floor(totalMinutes / 60);
        let minutes = totalMinutes % 60;

        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;

        return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    };

    // Get start hour based on preferred time
    const getStartHour = () => {
        const timeMap = {
            Morning: 8,
            Afternoon: 12,
            Evening: 16
        };
        return timeMap[preferredTime] || 8;
    };

    // Distribute tasks
    const distributeTasks = (taskList, days, slotsPerDay) => {
        let result = [];

        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        const sortedTasks = [...taskList].sort((a, b) =>
            priorityOrder[b.priority] - priorityOrder[a.priority]
        );

        const difficultyWeight = { Hard: 3, Medium: 2, Easy: 1 };
        let expanded = [];

        sortedTasks.forEach(task => {
            let count = difficultyWeight[task.difficulty];
            for (let i = 0; i < count; i++) {
                expanded.push(task);
            }
        });

        let index = 0;

        for (let d = 0; d < days; d++) {
            let dayTasks = [];
            let used = new Set();

            for (let s = 0; s < slotsPerDay; s++) {
                let tries = 0;

                while (tries < expanded.length) {
                    let task = expanded[index % expanded.length];

                    if (!used.has(task.name)) {
                        dayTasks.push(task);
                        used.add(task.name);
                        index++;
                        break;
                    }

                    index++;
                    tries++;
                }

                if (dayTasks.length < s + 1) {
                    dayTasks.push(expanded[index % expanded.length]);
                    index++;
                }
            }

            result.push(dayTasks);
        }

        return result;
    };

    // Build timetable
    const buildTimetable = (taskList, days, slots) => {
        const distributed = distributeTasks(taskList, days, slots.length);

        const schedule = distributed.map((dayTasks, i) => {
            let dateStr = null;
            if (inputMode === 'dateRange' && startDate) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }

            return {
                day: `Day ${i + 1}`,
                date: dateStr,
                slots: dayTasks.map((task, idx) => ({
                    time: slots[idx],
                    task: task.name,
                    priority: task.priority,
                    difficulty: task.difficulty
                }))
            };
        });

        return schedule;
    };

    // Generate timetable with loading and auto-scroll
    const generateTimetable = async () => {
        if (!validateInputs()) return;

        setLoading(true);

        // Simulate processing time for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const validTasks = tasks.filter(t => t.name.trim() !== '');
            const days = getTotalDays();
            const slotsPerDay = Math.floor(dailyHours);

            const startHour = getStartHour();
            const slots = generateTimeSlots(startHour, slotsPerDay, breakDuration);
            const schedule = buildTimetable(validTasks, days, slots);

            const totalStudyTime = days * slotsPerDay;
            const taskCoverage = {};
            schedule.forEach(day => {
                day.slots.forEach(slot => {
                    taskCoverage[slot.task] = (taskCoverage[slot.task] || 0) + 1;
                });
            });

            const mostFrequentTask = Object.keys(taskCoverage).length > 0
                ? Object.keys(taskCoverage).reduce((a, b) =>
                    taskCoverage[a] > taskCoverage[b] ? a : b
                )
                : '';

            const highPriorityTasks = validTasks.filter(t => t.priority === 'High').map(t => t.name);

            const statsData = {
                totalStudyTime,
                taskCoverage,
                mostFrequentTask,
                highPriorityTasks,
                totalTasks: validTasks.length,
                totalSlots: days * slotsPerDay
            };

            setStats(statsData);
            setTimetable(schedule);

            // Save to Firestore
            if (currentUser) {
                try {
                    await savePlanner(currentUser.uid, {
                        tasks: validTasks,
                        inputMode,
                        totalDays: inputMode === 'days' ? totalDays : null,
                        startDate: inputMode === 'dateRange' ? startDate : null,
                        endDate: inputMode === 'dateRange' ? endDate : null,
                        dailyHours,
                        breakDuration,
                        preferredTime,
                        timetable: schedule,
                        stats: statsData
                    });
                    showToast('Timetable generated and saved successfully! 🎉', 'success');
                    // Reload saved planners list
                    loadSavedPlanners();
                } catch (error) {
                    console.error('Error saving planner:', error);
                    showToast('Timetable generated but failed to save', 'warning');
                }
            } else {
                showToast('Timetable generated successfully! 🎉', 'success');
            }

            // Clear selected planner since this is a new one
            setSelectedPlanner(null);

            // Auto-scroll to timetable after a short delay
            setTimeout(() => {
                if (timetableRef.current) {
                    timetableRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 500);
        } catch (error) {
            showToast('Failed to generate timetable. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-50 border-red-200';
            case 'Medium': return 'bg-yellow-50 border-yellow-200';
            case 'Low': return 'bg-green-50 border-green-200';
            default: return 'bg-gray-50 border-gray-200';
        }
    };

    const getPriorityDot = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-500';
            case 'Medium': return 'bg-yellow-500';
            case 'Low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={closeToast}
                />
            )}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Study Planner</h1>
                        <p className="text-gray-600">AI-powered intelligent timetable generator</p>
                    </div>
                    {savedPlanners.length > 0 && (
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all"
                        >
                            <FaHistory />
                            <span>View History ({savedPlanners.length})</span>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Saved Planners History */}
            <AnimatePresence>
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white border border-gray-200 rounded-xl p-6 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Saved Timetables</h2>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {loadingPlanners ? (
                            <div className="text-center py-8">
                                <FaSpinner className="text-4xl text-gray-400 animate-spin mx-auto mb-2" />
                                <p className="text-gray-600">Loading planners...</p>
                            </div>
                        ) : savedPlanners.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600">No saved planners yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {savedPlanners.map((planner, index) => (
                                    <motion.div
                                        key={planner.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`border-2 rounded-xl p-4 transition-all ${
                                            selectedPlanner?.id === planner.id
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {planner.inputMode === 'dateRange' && planner.startDate
                                                            ? `${new Date(planner.startDate).toLocaleDateString()} - ${new Date(planner.endDate).toLocaleDateString()}`
                                                            : `${planner.totalDays || 0} Days Plan`}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {planner.timestamp?.toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {planner.tasks?.slice(0, 3).map((task, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                                        >
                                                            {task.name}
                                                        </span>
                                                    ))}
                                                    {planner.tasks?.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                                            +{planner.tasks.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs text-gray-600">
                                                    <span>📚 {planner.stats?.totalTasks || 0} tasks</span>
                                                    <span>⏰ {planner.dailyHours || 0}h/day</span>
                                                    <span>🎯 {planner.stats?.totalStudyTime || 0}h total</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                                                <button
                                                    onClick={() => handleViewPlanner(planner)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-1"
                                                >
                                                    <FaEye />
                                                    <span>View</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlanner(planner.id)}
                                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-all"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tasks Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6"
            >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaCalendar className="text-gray-700" />
                    Tasks / Subjects
                </h2>

                <div className="space-y-3">
                    {tasks.map((task) => (
                        <div key={task.id} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <input
                                type="text"
                                placeholder="Task name (e.g., Data Structures)"
                                value={task.name}
                                onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                                className="md:col-span-4 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            <select
                                value={task.priority}
                                onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                                className="md:col-span-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="High">High Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="Low">Low Priority</option>
                            </select>
                            <select
                                value={task.difficulty}
                                onChange={(e) => updateTask(task.id, 'difficulty', e.target.value)}
                                className="md:col-span-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="Hard">Hard</option>
                                <option value="Medium">Medium</option>
                                <option value="Easy">Easy</option>
                            </select>
                            {tasks.length > 1 && (
                                <button
                                    onClick={() => removeTask(task.id)}
                                    className="md:col-span-2 px-4 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600 transition-all"
                                >
                                    <FaTrash className="mx-auto" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <button
                    onClick={addTask}
                    className="mt-4 px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg text-gray-900 font-medium transition-all flex items-center gap-2"
                >
                    <FaPlus /> Add Task
                </button>
            </motion.div>

            {/* Schedule Duration */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 rounded-xl p-6"
            >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaClock className="text-gray-700" />
                    Schedule Duration
                </h2>

                <div className="flex gap-6 mb-4">
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                        <input
                            type="radio"
                            value="days"
                            checked={inputMode === 'days'}
                            onChange={(e) => setInputMode(e.target.value)}
                            className="w-4 h-4 text-gray-900"
                        />
                        Number of Days
                    </label>
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                        <input
                            type="radio"
                            value="dateRange"
                            checked={inputMode === 'dateRange'}
                            onChange={(e) => setInputMode(e.target.value)}
                            className="w-4 h-4 text-gray-900"
                        />
                        Date Range
                    </label>
                </div>

                {inputMode === 'days' ? (
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={totalDays}
                        onChange={(e) => setTotalDays(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Enter number of days"
                    />
                ) : (
                    <div className="flex gap-4 items-center">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <span className="text-gray-600">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                )}
            </motion.div>

            {/* Study Preferences */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border border-gray-200 rounded-xl p-6"
            >
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaChartLine className="text-gray-700" />
                    Study Preferences
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">Daily Study Hours</label>
                        <input
                            type="number"
                            min="1"
                            max="12"
                            value={dailyHours}
                            onChange={(e) => setDailyHours(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2 text-sm font-medium">Break Duration (minutes)</label>
                        <input
                            type="number"
                            min="0"
                            max="60"
                            value={breakDuration}
                            onChange={(e) => setBreakDuration(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 mb-2 text-sm font-medium">Preferred Time Slot</label>
                    <select
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="Morning">Morning (8 AM - 12 PM)</option>
                        <option value="Afternoon">Afternoon (12 PM - 4 PM)</option>
                        <option value="Evening">Evening (4 PM - 8 PM)</option>
                    </select>
                </div>
            </motion.div>

            {/* Generate Button */}
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={generateTimetable}
                disabled={loading}
                className="w-full px-8 py-4 bg-gray-900 hover:bg-gray-800 rounded-xl text-white font-semibold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <>
                        <FaSpinner className="text-2xl animate-spin" />
                        Generating Your Smart Timetable...
                    </>
                ) : (
                    <>
                        <FaBrain className="text-2xl" />
                        Generate Smart Timetable
                    </>
                )}
            </motion.button>

            {/* Loading Animation */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white border border-gray-200 rounded-xl p-12 text-center"
                    >
                        <FaSpinner className="text-6xl text-gray-900 animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Perfect Study Plan</h3>
                        <p className="text-gray-600">Analyzing tasks, priorities, and optimizing your schedule...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Currently Viewing Badge */}
            {selectedPlanner && timetable && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-indigo-50 border border-indigo-200 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                <FaHistory className="text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-indigo-700 font-medium">Viewing Saved Planner</p>
                                <p className="text-xs text-indigo-600">
                                    Created on {selectedPlanner.timestamp?.toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedPlanner(null);
                                setTimetable(null);
                                setStats(null);
                            }}
                            className="px-4 py-2 bg-white hover:bg-gray-50 border border-indigo-300 text-indigo-700 rounded-lg text-sm font-medium transition-all"
                        >
                            Clear View
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Stats Section */}
            {timetable && stats && !loading && (
                <>
                    <motion.div
                        ref={timetableRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalStudyTime}</div>
                            <div className="text-sm text-gray-600">Total Study Hours</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalTasks}</div>
                            <div className="text-sm text-gray-600">Total Tasks</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.totalSlots}</div>
                            <div className="text-sm text-gray-600">Study Sessions</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                            <div className="text-lg font-bold text-gray-900 mb-2 truncate">{stats.mostFrequentTask}</div>
                            <div className="text-sm text-gray-600">Most Frequent</div>
                        </div>
                    </motion.div>

                    {stats.highPriorityTasks.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-4"
                        >
                            <strong className="text-red-700">🔥 High Priority Tasks:</strong>
                            <span className="text-gray-900 ml-2">{stats.highPriorityTasks.join(', ')}</span>
                        </motion.div>
                    )}

                    {/* Timetable Display */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Smart Study Plan</h2>

                        {/* Legend */}
                        <div className="flex justify-center gap-6 mb-6 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-red-500"></span>
                                <span className="text-gray-700 text-sm font-medium">High Priority</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
                                <span className="text-gray-700 text-sm font-medium">Medium Priority</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-green-500"></span>
                                <span className="text-gray-700 text-sm font-medium">Low Priority</span>
                            </div>
                        </div>

                        {/* Timetable Grid */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-gray-900 text-white p-4 border border-gray-300 sticky left-0 z-10">Day</th>
                                        {timetable[0]?.slots.map((slot, i) => (
                                            <th key={i} className="bg-gray-100 text-gray-900 p-4 border border-gray-300 min-w-[180px] text-sm font-semibold">
                                                {slot.time}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timetable.map((day, i) => (
                                        <tr key={i}>
                                            <td className="bg-gray-900 text-white p-4 border border-gray-300 font-semibold sticky left-0 z-10">
                                                <div>{day.day}</div>
                                                {day.date && <div className="text-xs text-gray-300 mt-1">{day.date}</div>}
                                            </td>
                                            {day.slots.map((slot, j) => (
                                                <td key={j} className={`p-4 border border-gray-300 ${getPriorityColor(slot.priority)} transition-all hover:shadow-md cursor-pointer`}>
                                                    <div className="flex items-center justify-center gap-2 mb-1">
                                                        <span className={`w-3 h-3 rounded-full ${getPriorityDot(slot.priority)}`}></span>
                                                        <span className="text-gray-900 font-semibold text-sm">{slot.task}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-600 text-center">{slot.difficulty}</div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default SmartPlanner;
