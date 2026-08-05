// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTIVITY CALCULATOR — Single Source of Truth
// All momentum, focus, study-time, distraction, and streak calculations
// live here. No logic is duplicated across components.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Constants ───────────────────────────────────────────────────────────────

/** Minimum study seconds to count a day as "active" (5 minutes) */
export const MIN_ACTIVE_SECONDS = 300;

/** Max realistic study seconds per day (18 hours) */
export const MAX_DAILY_STUDY_SECONDS = 18 * 3600;

/** Max realistic distraction seconds per day (18 hours) */
export const MAX_DAILY_DISTRACTION_SECONDS = 18 * 3600;

// ─── Data Validation ─────────────────────────────────────────────────────────

/**
 * Sanitise a raw seconds value coming from the extension backend.
 * Rejects negatives, NaN, Infinity, and unrealistically large values.
 * @param {*} raw - Raw value from backend
 * @param {number} max - Maximum allowed value in seconds
 * @returns {number} - Safe non-negative integer seconds
 */
export function sanitiseSeconds(raw, max = MAX_DAILY_STUDY_SECONDS) {
    const n = Number(raw);
    if (!isFinite(n) || isNaN(n) || n < 0) return 0;
    return Math.min(Math.round(n), max);
}

/**
 * Sanitise a raw hours value (weekly data comes in hours from the backend).
 * @param {*} raw - Raw value from backend
 * @param {number} maxHours - Maximum allowed hours per day (default 18)
 * @returns {number} - Safe non-negative decimal hours
 */
export function sanitiseHours(raw, maxHours = 18) {
    const n = Number(raw);
    if (!isFinite(n) || isNaN(n) || n < 0) return 0;
    return Math.min(n, maxHours);
}

/**
 * Validate a full today-analytics object returned by the extension backend.
 * Returns a clean object with guaranteed numeric fields in SECONDS.
 */
export function validateTodayAnalytics(raw) {
    if (!raw || typeof raw !== 'object') {
        return { totalStudyTime: 0, totalDistractionTime: 0, sessionCount: 0, trend: 0 };
    }
    return {
        totalStudyTime: sanitiseSeconds(raw.totalStudyTime, MAX_DAILY_STUDY_SECONDS),
        totalDistractionTime: sanitiseSeconds(raw.totalDistractionTime, MAX_DAILY_DISTRACTION_SECONDS),
        sessionCount: Math.max(0, Math.round(Number(raw.sessionCount) || 0)),
        trend: isFinite(Number(raw.trend)) ? Math.round(Number(raw.trend)) : 0,
    };
}

/**
 * Validate a single day entry from the weekly analytics array.
 * Weekly data uses HOURS (not seconds) as returned by the backend.
 */
export function validateDayAnalytics(raw) {
    if (!raw || typeof raw !== 'object') {
        return { day: '', date: '', studyTime: 0, distractionTime: 0, focusSessions: 0, focusScore: 0 };
    }
    const studyTime = sanitiseHours(raw.studyTime);
    const distractionTime = sanitiseHours(raw.distractionTime);
    const focusScore = computeProductiveScore(studyTime * 3600, distractionTime * 3600);
    return {
        day: String(raw.day || ''),
        date: String(raw.date || ''),
        studyTime,
        distractionTime,
        focusSessions: Math.max(0, Math.round(Number(raw.focusSessions) || 0)),
        focusScore,   // always recomputed — never trust the stored value
    };
}

// ─── Core Score Calculations ──────────────────────────────────────────────────

/**
 * Productive Score = studySeconds / (studySeconds + distractionSeconds) × 100
 * Clamped 0–100. Returns 0 when no tracked time exists.
 *
 * This is the SINGLE implementation used everywhere.
 * Do NOT duplicate this logic in other files.
 *
 * @param {number} studySeconds     - Study time in seconds
 * @param {number} distractionSeconds - Distraction time in seconds
 * @returns {number} - Integer 0–100
 */
export function computeProductiveScore(studySeconds, distractionSeconds) {
    const s = sanitiseSeconds(studySeconds, MAX_DAILY_STUDY_SECONDS);
    const d = sanitiseSeconds(distractionSeconds, MAX_DAILY_DISTRACTION_SECONDS);
    const total = s + d;
    if (total === 0) return 0;
    return Math.max(0, Math.min(100, Math.round((s / total) * 100)));
}

/**
 * Compute productive score from a weekly-analytics day object (hours-based).
 * @param {Object} dayObj - Validated day analytics object
 * @returns {number} - Integer 0–100
 */
export function computeProductiveScoreFromDay(dayObj) {
    return computeProductiveScore(
        (dayObj.studyTime || 0) * 3600,
        (dayObj.distractionTime || 0) * 3600
    );
}

/**
 * Compute average productive score across a validated weekly array.
 * @param {Array} weeklyData - Array of validated day objects
 * @returns {number} - Integer 0–100
 */
export function computeAvgProductiveScore(weeklyData) {
    if (!Array.isArray(weeklyData) || weeklyData.length === 0) return 0;
    const activeDays = weeklyData.filter(d => (d.studyTime || 0) > 0);
    if (activeDays.length === 0) return 0;
    const sum = activeDays.reduce((acc, d) => acc + computeProductiveScoreFromDay(d), 0);
    return Math.round(sum / activeDays.length);
}

// ─── Study / Distraction Aggregation ─────────────────────────────────────────

/**
 * Sum total study hours from a validated weekly array.
 * @param {Array} weeklyData
 * @returns {number} - Decimal hours
 */
export function sumWeeklyStudyHours(weeklyData) {
    if (!Array.isArray(weeklyData)) return 0;
    return weeklyData.reduce((acc, d) => acc + sanitiseHours(d.studyTime), 0);
}

/**
 * Sum total distraction hours from a validated weekly array.
 * @param {Array} weeklyData
 * @returns {number} - Decimal hours
 */
export function sumWeeklyDistractionHours(weeklyData) {
    if (!Array.isArray(weeklyData)) return 0;
    return weeklyData.reduce((acc, d) => acc + sanitiseHours(d.distractionTime), 0);
}

/**
 * Convert weekly hours to seconds for display via formatStudyTime().
 * @param {number} hours
 * @returns {number} - Seconds
 */
export function hoursToSeconds(hours) {
    return sanitiseHours(hours) * 3600;
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

/**
 * Calculate current study streak from a weekly analytics array.
 * A day counts as "active" only if studyTime >= MIN_ACTIVE_SECONDS / 3600 hours.
 *
 * Sorts by date descending so the most recent day is checked first.
 * Stops counting at the first day with insufficient study time.
 *
 * @param {Array} weeklyData - Array of validated day objects with `date` and `studyTime`
 * @returns {number} - Streak count (days)
 */
export function computeStreak(weeklyData) {
    if (!Array.isArray(weeklyData) || weeklyData.length === 0) return 0;

    const minHours = MIN_ACTIVE_SECONDS / 3600; // ~0.083 hours = 5 minutes

    // Sort descending by date string (ISO format sorts correctly lexicographically)
    const sorted = [...weeklyData]
        .filter(d => d.date)
        .sort((a, b) => b.date.localeCompare(a.date));

    let streak = 0;
    for (const day of sorted) {
        if (sanitiseHours(day.studyTime) >= minHours) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

// ─── Momentum Score ───────────────────────────────────────────────────────────

/**
 * Scoring weights — must sum to 1.0 across positive components.
 * Penalties are applied on top and can reduce the final score.
 */
const WEIGHTS = {
    // Task completion (30%)
    SELF_TASKS: 0.10,
    TEACHER_TASKS: 0.12,
    PEER_TASKS: 0.08,
    COMPLETION_BONUS: 0.05, // only if ≥80% completion rate

    // Study quality (25%)
    STUDY_HOURS: 0.12, // avg daily hours vs 6h target
    FOCUS_SESSIONS: 0.08, // days with study > threshold
    PRODUCTIVE_SCORE: 0.05, // study/(study+distraction)

    // Consistency (20%)
    STREAK: 0.10, // streak vs 30-day target
    WEEKLY_CONSISTENCY: 0.06, // active days / 7
    HABIT_CONSISTENCY: 0.04, // habit completion rate

    // Engagement (15%)
    MOOD_TRACKING: 0.02, // ≥3 mood entries this week
    AI_MENTOR: 0.03, // used AI mentor in last 7 days
    PRODUCTIVITY_GROWTH: 0.05, // second half of week > first half
    ON_TIME_TASKS: 0.05, // completed tasks before due date

    // Penalties (reduce score)
    DISTRACTION_PENALTY: -0.08, // applied when distraction > 30% of total
    OVERDUE_PENALTY: -0.05, // applied proportionally to overdue tasks
};

const MAX_SCORE = 100;

/**
 * Compute the full momentum score from pre-fetched data.
 * All inputs must already be validated/sanitised.
 *
 * @param {Object} params
 * @param {Array}  params.selfTasks       - User's own tasks
 * @param {Array}  params.assignedTasks   - Teacher/peer assigned tasks
 * @param {Object} params.todayAnalytics  - Validated today analytics (seconds)
 * @param {Array}  params.weeklyAnalytics - Validated weekly analytics (hours)
 * @param {Array}  params.habits          - User habits array
 * @param {Array}  params.moodData        - Mood history array
 * @param {Object} params.userData        - Firestore user document data
 * @returns {Object} - { total, components, details }
 */
export function computeMomentumScore({
    selfTasks = [],
    assignedTasks = [],
    todayAnalytics = {},
    weeklyAnalytics = [],
    habits = [],
    moodData = [],
    userData = {},
}) {
    let score = 0;

    // ── 1. Task Completion (30%) ──────────────────────────────────────────────

    const selfTotal = selfTasks.length;
    const selfCompleted = selfTasks.filter(t => t.completed).length;
    const taskSelf = selfTotal > 0 ? (selfCompleted / selfTotal) * WEIGHTS.SELF_TASKS * MAX_SCORE : 0;

    const teacherTasks = assignedTasks.filter(t => t.taskType === 'teacher_assigned');
    const teacherCompleted = teacherTasks.filter(t => t.completed).length;
    const taskTeacher = teacherTasks.length > 0
        ? (teacherCompleted / teacherTasks.length) * WEIGHTS.TEACHER_TASKS * MAX_SCORE
        : 0;

    const peerTasks = assignedTasks.filter(t => t.taskType === 'peer_challenge');
    const peerCompleted = peerTasks.filter(t => t.completed).length;
    const taskPeer = peerTasks.length > 0
        ? (peerCompleted / peerTasks.length) * WEIGHTS.PEER_TASKS * MAX_SCORE
        : 0;

    const allTasks = [...selfTasks, ...assignedTasks];
    const allCompleted = allTasks.filter(t => t.completed).length;
    const completionRate = allTasks.length > 0 ? allCompleted / allTasks.length : 0;
    const taskBonus = completionRate >= 0.8 ? WEIGHTS.COMPLETION_BONUS * MAX_SCORE : 0;

    const taskScore = taskSelf + taskTeacher + taskPeer + taskBonus;
    score += taskScore;

    // ── 2. Study Quality (25%) ────────────────────────────────────────────────

    const weeklyStudyHours = sumWeeklyStudyHours(weeklyAnalytics);
    const avgDailyHours = weeklyStudyHours / 7;
    const studyHoursScore = Math.min(1, avgDailyHours / 6) * WEIGHTS.STUDY_HOURS * MAX_SCORE;

    // Focus sessions = days with meaningful study (≥ MIN_ACTIVE_SECONDS)
    const minHours = MIN_ACTIVE_SECONDS / 3600;
    const activeDays = weeklyAnalytics.filter(d => sanitiseHours(d.studyTime) >= minHours).length;
    const focusSessionScore = (activeDays / 7) * WEIGHTS.FOCUS_SESSIONS * MAX_SCORE;

    // Productive score from today's data (seconds)
    const todayStudySec = sanitiseSeconds(todayAnalytics.totalStudyTime, MAX_DAILY_STUDY_SECONDS);
    const todayDistSec = sanitiseSeconds(todayAnalytics.totalDistractionTime, MAX_DAILY_DISTRACTION_SECONDS);
    const productiveScore = computeProductiveScore(todayStudySec, todayDistSec);
    const productiveScoreContrib = (productiveScore / 100) * WEIGHTS.PRODUCTIVE_SCORE * MAX_SCORE;

    const studyScore = studyHoursScore + focusSessionScore + productiveScoreContrib;
    score += studyScore;

    // ── 3. Consistency (20%) ──────────────────────────────────────────────────

    // Use streak from weeklyData (computed, not stale Firestore value)
    const streak = computeStreak(weeklyAnalytics);
    const streakScore = Math.min(1, streak / 30) * WEIGHTS.STREAK * MAX_SCORE;

    const weeklyConsistencyScore = (activeDays / 7) * WEIGHTS.WEEKLY_CONSISTENCY * MAX_SCORE;

    let habitScore = 0;
    if (habits.length > 0) {
        const habitRate = habits.reduce((sum, h) => {
            const completed = h.completedDates?.length || 0;
            const totalDays = Math.max(1, Math.floor(
                (Date.now() - new Date(h.createdAt).getTime()) / (1000 * 60 * 60 * 24)
            ));
            // Cap at 1.0 to avoid habits created today inflating the score
            return sum + Math.min(1, completed / totalDays);
        }, 0) / habits.length;
        habitScore = habitRate * WEIGHTS.HABIT_CONSISTENCY * MAX_SCORE;
    }

    const consistencyScore = streakScore + weeklyConsistencyScore + habitScore;
    score += consistencyScore;

    // ── 4. Engagement (15%) ───────────────────────────────────────────────────

    const moodScore = moodData.length >= 3 ? WEIGHTS.MOOD_TRACKING * MAX_SCORE : 0;

    const lastMentorUse = userData.lastAIMentorUse ? new Date(userData.lastAIMentorUse) : null;
    const mentorScore = lastMentorUse && (Date.now() - lastMentorUse.getTime()) < 7 * 24 * 3600 * 1000
        ? WEIGHTS.AI_MENTOR * MAX_SCORE
        : 0;

    // Productivity growth: compare second half of week vs first half
    let growthScore = 0;
    if (weeklyAnalytics.length >= 6) {
        const firstHalf = weeklyAnalytics.slice(0, 3).reduce((s, d) => s + sanitiseHours(d.studyTime), 0) / 3;
        const secondHalf = weeklyAnalytics.slice(4, 7).reduce((s, d) => s + sanitiseHours(d.studyTime), 0) / 3;
        if (firstHalf > 0 && secondHalf > firstHalf) {
            const growthRate = Math.min(1, (secondHalf - firstHalf) / firstHalf);
            growthScore = growthRate * WEIGHTS.PRODUCTIVITY_GROWTH * MAX_SCORE;
        }
    }

    // On-time task completion
    const completedTasks = allTasks.filter(t => t.completed);
    const onTimeTasks = completedTasks.filter(t => !_isCompletedLate(t));
    const onTimeRate = completedTasks.length > 0 ? onTimeTasks.length / completedTasks.length : 0;
    const onTimeScore = onTimeRate * WEIGHTS.ON_TIME_TASKS * MAX_SCORE;

    const engagementScore = moodScore + mentorScore + growthScore + onTimeScore;
    score += engagementScore;

    // ── 5. Penalties ──────────────────────────────────────────────────────────

    // Distraction penalty — only when distraction > 30% of total tracked time
    const weeklyDistHours = sumWeeklyDistractionHours(weeklyAnalytics);
    const weeklyTotalHours = weeklyStudyHours + weeklyDistHours;
    let distractionPenalty = 0;
    if (weeklyTotalHours > 0) {
        const distractionRatio = weeklyDistHours / weeklyTotalHours;
        if (distractionRatio > 0.3) {
            // Penalty scales with how far above 30% the ratio is
            distractionPenalty = (distractionRatio - 0.3) * Math.abs(WEIGHTS.DISTRACTION_PENALTY) * MAX_SCORE;
        }
    }

    // Overdue tasks penalty
    const overdueTasks = allTasks.filter(t => !t.completed && _isOverdue(t));
    const overduePenalty = allTasks.length > 0
        ? (overdueTasks.length / allTasks.length) * Math.abs(WEIGHTS.OVERDUE_PENALTY) * MAX_SCORE
        : 0;

    const totalPenalty = distractionPenalty + overduePenalty;
    score -= totalPenalty;

    // ── Final Score ───────────────────────────────────────────────────────────

    const finalScore = Math.max(0, Math.min(MAX_SCORE, Math.round(score)));

    console.log('[Momentum Calculation]', {
        inputs: {
            selfTasks: selfTotal,
            selfCompleted,
            teacherTasks: teacherTasks.length,
            teacherCompleted,
            weeklyStudyHours: weeklyStudyHours.toFixed(2),
            avgDailyHours: avgDailyHours.toFixed(2),
            activeDays,
            streak,
            todayStudySec,
            todayDistSec,
            productiveScore,
            moodEntries: moodData.length,
            habits: habits.length,
        },
        components: {
            taskScore: Math.round(taskScore),
            studyScore: Math.round(studyScore),
            consistencyScore: Math.round(consistencyScore),
            engagementScore: Math.round(engagementScore),
            distractionPenalty: -Math.round(distractionPenalty),
            overduePenalty: -Math.round(overduePenalty),
        },
        finalScore,
    });

    return {
        total: finalScore,
        components: {
            tasks: Math.round(taskScore),
            study: Math.round(studyScore),
            consistency: Math.round(consistencyScore),
            engagement: Math.round(engagementScore),
            penalties: -Math.round(totalPenalty),
        },
        details: {
            selfTasksCompleted: selfCompleted,
            teacherTasksCompleted: teacherCompleted,
            peerTasksCompleted: peerCompleted,
            totalStudyHours: parseFloat(weeklyStudyHours.toFixed(2)),
            currentStreak: streak,
            focusScore: productiveScore,
            distractionTime: todayDistSec,
            overdueTasksCount: overdueTasks.length,
        },
    };
}

// ─── Private Helpers ──────────────────────────────────────────────────────────

function _isOverdue(task) {
    if (!task.dueDate) return false;
    const due = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    return isFinite(due.getTime()) && due < new Date();
}

function _isCompletedLate(task) {
    if (!task.dueDate || !task.completedAt) return false;
    const due = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    const done = task.completedAt instanceof Date ? task.completedAt : new Date(task.completedAt);
    return isFinite(due.getTime()) && isFinite(done.getTime()) && done > due;
}
