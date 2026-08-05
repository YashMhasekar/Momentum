import React, { useState } from 'react';
import './TimetableGenerator.css';

const TimetableGenerator = () => {
  const [tasks, setTasks] = useState([
    { id: 1, name: '', priority: 'Medium', difficulty: 'Medium' }
  ]);
  const [dateMode, setDateMode] = useState('days'); // 'days' or 'range'
  const [totalDays, setTotalDays] = useState(7);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dailyHours, setDailyHours] = useState(4);
  const [preferredTime, setPreferredTime] = useState('Morning');
  const [breakDuration, setBreakDuration] = useState(15);
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addTask = () => {
    setTasks([
      ...tasks,
      { id: Date.now(), name: '', priority: 'Medium', difficulty: 'Medium' }
    ]);
  };

  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const calculateDays = () => {
    if (dateMode === 'days') {
      return parseInt(totalDays);
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
  };

  const generateLocalTimetable = () => {
    const validTasks = tasks.filter(t => t.name.trim() !== '');
    if (validTasks.length === 0) return null;

    const days = calculateDays();
    const hoursPerDay = parseFloat(dailyHours);
    const breakMinutes = parseInt(breakDuration);

    // Priority weights
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    const difficultyWeight = { Hard: 3, Medium: 2, Easy: 1 };

    // Calculate time allocation for each task
    const tasksWithTime = validTasks.map(task => {
      const weight = priorityWeight[task.priority] * difficultyWeight[task.difficulty];
      return { ...task, weight };
    });

    const totalWeight = tasksWithTime.reduce((sum, t) => sum + t.weight, 0);
    const totalAvailableMinutes = days * hoursPerDay * 60;
    const totalBreakMinutes = days * Math.floor((hoursPerDay * 60) / 60) * breakMinutes;
    const totalStudyMinutes = totalAvailableMinutes - totalBreakMinutes;

    tasksWithTime.forEach(task => {
      task.allocatedMinutes = Math.round((task.weight / totalWeight) * totalStudyMinutes);
    });

    // Distribute tasks across days
    const schedule = [];
    let currentDay = 0;
    let currentDayMinutes = 0;
    const maxMinutesPerDay = hoursPerDay * 60 - Math.floor(hoursPerDay) * breakMinutes;

    // Sort by priority and difficulty
    const sortedTasks = [...tasksWithTime].sort((a, b) => b.weight - a.weight);

    sortedTasks.forEach(task => {
      let remainingMinutes = task.allocatedMinutes;

      while (remainingMinutes > 0) {
        if (currentDay >= days) break;

        const availableToday = maxMinutesPerDay - currentDayMinutes;
        const timeToAllocate = Math.min(remainingMinutes, availableToday, 90); // Max 90 min per session

        if (timeToAllocate >= 15) { // Minimum 15 min session
          if (!schedule[currentDay]) {
            schedule[currentDay] = [];
          }

          schedule[currentDay].push({
            taskName: task.name,
            priority: task.priority,
            duration: timeToAllocate
          });

          currentDayMinutes += timeToAllocate + breakMinutes;
          remainingMinutes -= timeToAllocate;
        }

        if (currentDayMinutes >= maxMinutesPerDay) {
          currentDay++;
          currentDayMinutes = 0;
        }
      }
    });

    // Generate time slots
    const getStartTime = () => {
      if (preferredTime === 'Morning') return 8;
      if (preferredTime === 'Afternoon') return 14;
      return 18;
    };

    const startHour = getStartTime();
    const timetableData = schedule.map((dayTasks, index) => {
      let currentTime = startHour * 60; // in minutes
      const slots = [];

      dayTasks.forEach((task, i) => {
        const startTimeStr = formatTime(currentTime);
        currentTime += task.duration;
        const endTimeStr = formatTime(currentTime);

        slots.push({
          ...task,
          timeRange: `${startTimeStr} - ${endTimeStr}`
        });

        if (i < dayTasks.length - 1) {
          currentTime += breakMinutes;
        }
      });

      return {
        day: index + 1,
        date: dateMode === 'range' ? getDateForDay(index) : null,
        slots
      };
    });

    return timetableData;
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const getDateForDay = (dayIndex) => {
    const start = new Date(startDate);
    const date = new Date(start);
    date.setDate(start.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const generateWithAI = async () => {
    const validTasks = tasks.filter(t => t.name.trim() !== '');
    
    if (validTasks.length === 0) {
      setError('Please add at least one task');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const days = calculateDays();
      
      const prompt = `You are an AI study planner. Generate an optimized study timetable based on the following:

Tasks:
${validTasks.map(t => `- ${t.name} (Priority: ${t.priority}, Difficulty: ${t.difficulty})`).join('\n')}

Schedule Parameters:
- Total days: ${days}
- Daily study hours: ${dailyHours}
- Preferred time: ${preferredTime}
- Break duration: ${breakDuration} minutes

Requirements:
1. Distribute tasks intelligently across ${days} days
2. High priority and hard tasks should get more time
3. Balance workload per day
4. Include breaks between study sessions
5. Each study session should be 30-90 minutes

Return ONLY a JSON array with this exact structure:
[
  {
    "day": 1,
    "slots": [
      {
        "taskName": "Task name",
        "priority": "High/Medium/Low",
        "duration": 60,
        "timeRange": "8:00 AM - 9:00 AM"
      }
    ]
  }
]`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Student Productivity App'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.1-8b-instruct:free',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI timetable');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const aiTimetable = JSON.parse(jsonMatch[0]);
        setTimetable(aiTimetable);
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError('AI generation failed. Using local algorithm instead.');
      const localTimetable = generateLocalTimetable();
      setTimetable(localTimetable);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validTasks = tasks.filter(t => t.name.trim() !== '');
    if (validTasks.length === 0) {
      setError('Please add at least one task');
      return;
    }

    if (dateMode === 'range' && (!startDate || !endDate)) {
      setError('Please select both start and end dates');
      return;
    }

    setError('');
    
    // Try AI generation first, fallback to local
    generateWithAI();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#ff4444';
      case 'Medium': return '#ffaa00';
      case 'Low': return '#44ff44';
      default: return '#888';
    }
  };

  return (
    <div className="timetable-generator">
      <div className="container">
        <h1 className="title">AI Timetable Generator</h1>
        
        <form onSubmit={handleSubmit} className="input-form">
          {/* Tasks Section */}
          <div className="form-section">
            <h2>Tasks / Subjects</h2>
            {tasks.map((task, index) => (
              <div key={task.id} className="task-input-group">
                <input
                  type="text"
                  placeholder="Task name"
                  value={task.name}
                  onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                  className="input-field"
                />
                <select
                  value={task.priority}
                  onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                  className="select-field"
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <select
                  value={task.difficulty}
                  onChange={(e) => updateTask(task.id, 'difficulty', e.target.value)}
                  className="select-field"
                >
                  <option value="Hard">Hard</option>
                  <option value="Medium">Medium</option>
                  <option value="Easy">Easy</option>
                </select>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(task.id)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addTask} className="add-task-btn">
              + Add Task
            </button>
          </div>

          {/* Date Selection */}
          <div className="form-section">
            <h2>Schedule Duration</h2>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="days"
                  checked={dateMode === 'days'}
                  onChange={(e) => setDateMode(e.target.value)}
                />
                Number of Days
              </label>
              <label>
                <input
                  type="radio"
                  value="range"
                  checked={dateMode === 'range'}
                  onChange={(e) => setDateMode(e.target.value)}
                />
                Date Range
              </label>
            </div>

            {dateMode === 'days' ? (
              <input
                type="number"
                min="1"
                max="365"
                value={totalDays}
                onChange={(e) => setTotalDays(e.target.value)}
                className="input-field"
                placeholder="Total days"
              />
            ) : (
              <div className="date-range">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {/* Study Preferences */}
          <div className="form-section">
            <h2>Study Preferences</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Daily Study Hours</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  step="0.5"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="form-group">
                <label>Break Duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={breakDuration}
                  onChange={(e) => setBreakDuration(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Preferred Study Time</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="select-field"
              >
                <option value="Morning">Morning (8 AM - 12 PM)</option>
                <option value="Afternoon">Afternoon (2 PM - 6 PM)</option>
                <option value="Evening">Evening (6 PM - 10 PM)</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Generating...' : '✨ Generate Timetable'}
          </button>
        </form>

        {/* Timetable Display */}
        {timetable && (
          <div className="timetable-section">
            <h2>Your Personalized Timetable</h2>
            <div className="timetable-grid">
              {timetable.map((day) => (
                <div key={day.day} className="day-card">
                  <div className="day-header">
                    <h3>Day {day.day}</h3>
                    {day.date && <span className="date">{day.date}</span>}
                  </div>
                  <div className="slots">
                    {day.slots.map((slot, index) => (
                      <div
                        key={index}
                        className="slot-card"
                        style={{ borderLeftColor: getPriorityColor(slot.priority) }}
                      >
                        <div className="slot-header">
                          <span className="task-name">{slot.taskName}</span>
                          <span
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(slot.priority) }}
                          >
                            {slot.priority}
                          </span>
                        </div>
                        <div className="time-range">{slot.timeRange}</div>
                        <div className="duration">{slot.duration} minutes</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableGenerator;
