import React, { useState } from 'react';
import './SmartTimetable.css';

const SmartTimetable = () => {
  const [tasks, setTasks] = useState([
    { id: 1, name: '', priority: 'Medium', difficulty: 'Medium' }
  ]);
  const [inputMode, setInputMode] = useState('days'); // 'days' or 'dateRange'
  const [totalDays, setTotalDays] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyHours, setDailyHours] = useState(4);
  const [breakDuration, setBreakDuration] = useState(15);
  const [preferredTime, setPreferredTime] = useState('Morning');
  const [timetable, setTimetable] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  // Add task
  const addTask = () => {
    setTasks([...tasks, { 
      id: Date.now(), 
      name: '', 
      priority: 'Medium', 
      difficulty: 'Medium' 
    }]);
  };

  // Remove task
  const removeTask = (id) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter(task => task.id !== id));
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
      setError('Please add at least one task');
      return false;
    }

    const days = getTotalDays();
    if (days <= 0) {
      setError('Please provide valid days or date range');
      return false;
    }

    if (dailyHours <= 0 || dailyHours > 24) {
      setError('Daily hours must be between 1 and 24');
      return false;
    }

    if (breakDuration < 0 || breakDuration > 60) {
      setError('Break duration must be between 0 and 60 minutes');
      return false;
    }

    return true;
  };

  // Generate time slots - CORRECTED VERSION
  const generateTimeSlots = (startHour, totalHours, breakMinutes) => {
    const slots = [];
    let currentMinutes = startHour * 60; // Convert to minutes
    
    for (let i = 0; i < totalHours; i++) {
      const startTime = formatTimeFromMinutes(currentMinutes);
      currentMinutes += 60; // Add 1 hour
      const endTime = formatTimeFromMinutes(currentMinutes);
      
      const timeSlot = `${startTime} - ${endTime}`;
      slots.push(timeSlot);
      
      // Add break (only between slots, not after last one)
      if (i < totalHours - 1) {
        currentMinutes += parseInt(breakMinutes);
      }
    }
    
    console.log('Generated time slots:', slots);
    return slots;
  };

  // Format time from minutes - CORRECTED VERSION
  const formatTimeFromMinutes = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;
    
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    
    const formatted = `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    return formatted;
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

  // Distribute tasks - FIXED LOGIC
  const distributeTasks = (taskList, days, slotsPerDay) => {
    let result = [];
    
    // Step 1: Sort by priority
    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    const sortedTasks = [...taskList].sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
    
    // Step 2: Expand tasks based on difficulty weight
    const difficultyWeight = { Hard: 3, Medium: 2, Easy: 1 };
    let expanded = [];
    
    sortedTasks.forEach(task => {
      let count = difficultyWeight[task.difficulty];
      for (let i = 0; i < count; i++) {
        expanded.push(task);
      }
    });
    
    // Step 3: Round-robin distribution
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
        
        // Fallback if all used
        if (dayTasks.length < s + 1) {
          dayTasks.push(expanded[index % expanded.length]);
          index++;
        }
      }
      
      result.push(dayTasks);
    }
    
    return result;
  };

  // Build timetable - FIXED STRUCTURE
  const buildTimetable = (taskList, days, slots) => {
    console.log('Building timetable with slots:', slots);
    const distributed = distributeTasks(taskList, days, slots.length);
    
    const schedule = distributed.map((dayTasks, i) => {
      // Calculate date for this day
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
      
      const daySchedule = {
        day: `Day ${i + 1}`,
        date: dateStr,
        slots: dayTasks.map((task, idx) => ({
          time: slots[idx],
          task: task.name,
          priority: task.priority,
          difficulty: task.difficulty
        }))
      };
      
      console.log(`Day ${i + 1} schedule:`, daySchedule);
      return daySchedule;
    });
    
    return schedule;
  };

  // Generate timetable - FINAL FLOW
  const generateTimetable = () => {
    if (!validateInputs()) return;

    setError('');
    const validTasks = tasks.filter(t => t.name.trim() !== '');
    const days = getTotalDays();
    const slotsPerDay = Math.floor(dailyHours);
    
    // Step 1: Generate time slots
    const startHour = getStartHour();
    const slots = generateTimeSlots(startHour, slotsPerDay, breakDuration);
    
    // Step 2: Build timetable
    const schedule = buildTimetable(validTasks, days, slots);

    // Step 3: Calculate statistics
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

    setStats({
      totalStudyTime,
      taskCoverage,
      mostFrequentTask,
      highPriorityTasks,
      totalTasks: validTasks.length,
      totalSlots: days * slotsPerDay
    });

    setTimetable(schedule);
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#d32f2f';
      case 'Medium': return '#f57c00';
      case 'Low': return '#388e3c';
      default: return '#888';
    }
  };

  // Get priority background color
  const getPriorityBackground = (priority) => {
    switch (priority) {
      case 'High': return '#ffebee';
      case 'Medium': return '#fff9e6';
      case 'Low': return '#e8f5e9';
      default: return '#f5f5f5';
    }
  };

  return (
    <div className="smart-timetable">
      <div className="container">
        <header className="header">
          <h1>📚 Smart Study Plan Generator</h1>
          <p>Rule-based intelligent timetable for students</p>
        </header>

        <div className="input-section">
          <div className="card">
            <h2>📝 Tasks / Subjects</h2>
            <div className="tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className="task-row">
                  <input
                    type="text"
                    placeholder="Task name (e.g., DSA)"
                    value={task.name}
                    onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                    className="input"
                  />
                  <select
                    value={task.priority}
                    onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                    className="select"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <select
                    value={task.difficulty}
                    onChange={(e) => updateTask(task.id, 'difficulty', e.target.value)}
                    className="select"
                  >
                    <option value="Hard">Hard</option>
                    <option value="Medium">Medium</option>
                    <option value="Easy">Easy</option>
                  </select>
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="btn-remove"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addTask} className="btn-add">
              + Add Task
            </button>
          </div>

          <div className="card">
            <h2>📅 Schedule Duration</h2>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="days"
                  checked={inputMode === 'days'}
                  onChange={(e) => setInputMode(e.target.value)}
                />
                Number of Days
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="dateRange"
                  checked={inputMode === 'dateRange'}
                  onChange={(e) => setInputMode(e.target.value)}
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
                className="input"
                placeholder="Enter number of days"
              />
            ) : (
              <div className="date-range">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input"
                />
                <span className="date-separator">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input"
                />
              </div>
            )}
          </div>

          <div className="card">
            <h2>⚙️ Study Preferences</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Daily Study Hours</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="input"
                />
              </div>
              <div className="form-group">
                <label>Break Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Preferred Time Slot</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="select"
              >
                <option value="Morning">Morning (8 AM - 12 PM)</option>
                <option value="Afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="Evening">Evening (4 PM - 8 PM)</option>
              </select>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button onClick={generateTimetable} className="btn-generate">
            ✨ Generate Smart Timetable
          </button>
        </div>

        {timetable && stats && (
          <>
            <div className="stats-section">
              <div className="stat-card">
                <div className="stat-value">{stats.totalStudyTime}</div>
                <div className="stat-label">Total Study Hours</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalTasks}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.totalSlots}</div>
                <div className="stat-label">Study Sessions</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-value">{stats.mostFrequentTask}</div>
                <div className="stat-label">Most Frequent Task</div>
              </div>
            </div>

            {stats.highPriorityTasks.length > 0 && (
              <div className="priority-highlight">
                <strong>🔥 High Priority Tasks:</strong> {stats.highPriorityTasks.join(', ')}
              </div>
            )}

            <div className="timetable-section">
              <h2 className="section-title">Your Smart Study Plan</h2>
              
              {/* Legend */}
              <div className="legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#ffebee' }}></span>
                  <span>High Priority</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#fff9e6' }}></span>
                  <span>Medium Priority</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: '#e8f5e9' }}></span>
                  <span>Low Priority</span>
                </div>
              </div>

              {/* Table Container - CLEAN VERSION */}
              <div className="table-container">
                <table className="timetable">
                  <thead>
                    <tr>
                      <th className="day-header">Day</th>
                      {timetable[0]?.slots.map((slot, i) => (
                        <th key={i} className="time-header">
                          {typeof slot.time === 'string' ? slot.time : 'Invalid Time'}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  <tbody>
                    {timetable.map((day, i) => (
                      <tr key={i}>
                        <td className="day-column">
                          <div className="day-info">
                            <div className="day-label">{day.day}</div>
                            {day.date && <div className="date-label">{day.date}</div>}
                          </div>
                        </td>
                        
                        {day.slots.map((s, j) => (
                          <td key={j} className="task-column">
                            <div className="task">
                              <span className="task-name">{s.task}</span>
                              <span className={`dot ${s.priority.toLowerCase()}`}></span>
                            </div>
                            <div className="task-difficulty">{s.difficulty}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartTimetable;
