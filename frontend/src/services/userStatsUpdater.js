// ═══════════════════════════════════════════════════════════════════════════
// USER STATS UPDATER - Background service to keep user stats current
// ═══════════════════════════════════════════════════════════════════════════

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getMomentumScore } from './momentumScoreEngine';
import { getWeeklyAnalytics } from './extensionService';
import { getUserTasks } from './taskService';
import { getAssignedTasks } from './collaborativeTaskService';
import {
    validateDayAnalytics,
    sanitiseHours,
    sumWeeklyStudyHours,
    sumWeeklyDistractionHours,
    computeProductiveScore,
} from '../utils/productivityCalculator';

/**
 * Update a single user's cached statistics
 * This should be called periodically or after significant user actions
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
export async function updateUserStats(userId) {
    try {
        console.log(`Updating stats for user: ${userId}`);

        // Fetch all required data in parallel
        const [momentumData, weeklyAnalytics, selfTasks, assignedTasks] = await Promise.all([
            getMomentumScore(userId, 60).catch(err => {
                console.warn(`Could not get momentum score for ${userId}:`, err);
                return { total: 0, components: {}, details: {} };
            }),
            getWeeklyAnalytics(userId).catch(err => {
                console.warn(`Could not get analytics for ${userId}:`, err);
                return [];
            }),
            getUserTasks(userId).catch(() => []),
            getAssignedTasks(userId).catch(() => [])
        ]);

        // Calculate task metrics
        const allTasks = [...selfTasks, ...assignedTasks];
        const completedTasks = allTasks.filter(t => t.completed);

        // Validate and sanitise every day entry before aggregating
        const validatedWeekly = weeklyAnalytics.map(validateDayAnalytics);

        // Calculate study metrics from validated weekly analytics
        const totalStudyHours = sumWeeklyStudyHours(validatedWeekly);
        const totalDistractionTime = sumWeeklyDistractionHours(validatedWeekly);
        const totalTime = totalStudyHours + totalDistractionTime;

        // Productive score: study / (study + distraction) — clamped 0–100
        const focusScore = computeProductiveScore(totalStudyHours * 3600, totalDistractionTime * 3600);
        const distractionRatio = totalTime > 0 ? totalDistractionTime / totalTime : 0;
        const focusSessions = validatedWeekly.reduce((sum, day) => sum + (day.focusSessions || 0), 0);

        // Weekly growth: compare second half vs first half of the week
        const firstHalf = validatedWeekly.slice(0, 3).reduce((s, d) => s + sanitiseHours(d.studyTime), 0) / 3;
        const secondHalf = validatedWeekly.slice(4, 7).reduce((s, d) => s + sanitiseHours(d.studyTime), 0) / 3;
        const weeklyGrowth = firstHalf > 0
            ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
            : 0;

        console.log('[Study Time Updated]', {
            userId,
            totalStudyHours: totalStudyHours.toFixed(2),
            totalDistractionTime: totalDistractionTime.toFixed(2),
            focusScore,
            weeklyGrowth,
        });
        console.log('[Distraction Updated]', {
            userId,
            totalDistractionTime: totalDistractionTime.toFixed(2),
            distractionRatio: distractionRatio.toFixed(3),
        });
        console.log('[Focus Score Updated]', { userId, focusScore });

        // Prepare update data
        const updateData = {
            // Core metrics
            momentumScore: momentumData.total || 0,
            momentumBreakdown: momentumData.components || {},

            // Study metrics
            totalStudyHours: totalStudyHours,
            focusScore: focusScore,
            distractionTime: totalDistractionTime,
            distractionRatio: distractionRatio,

            // Task metrics
            totalTasks: allTasks.length,
            completedTasks: completedTasks.length,

            // Consistency metrics
            focusSessions: focusSessions,

            // Growth metrics
            weeklyGrowth: weeklyGrowth,

            // Timestamp
            statsUpdatedAt: serverTimestamp()
        };

        // Update user document
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updateData);

        console.log(`✅ Successfully updated stats for user: ${userId}`);
        return true;
    } catch (error) {
        console.error(`❌ Error updating stats for user ${userId}:`, error);
        return false;
    }
}

/**
 * Update stats for multiple users in batch
 * @param {Array<string>} userIds - Array of user IDs
 * @param {number} concurrency - Number of concurrent updates
 * @returns {Promise<Object>} - Results summary
 */
export async function batchUpdateUserStats(userIds, concurrency = 5) {
    console.log(`Starting batch update for ${userIds.length} users with concurrency ${concurrency}`);

    const results = {
        total: userIds.length,
        successful: 0,
        failed: 0,
        errors: []
    };

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < userIds.length; i += concurrency) {
        const batch = userIds.slice(i, i + concurrency);
        const batchResults = await Promise.allSettled(
            batch.map(userId => updateUserStats(userId))
        );

        batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                results.successful++;
            } else {
                results.failed++;
                results.errors.push({
                    userId: batch[index],
                    error: result.reason || 'Unknown error'
                });
            }
        });

        // Log progress
        console.log(`Progress: ${Math.min(i + concurrency, userIds.length)}/${userIds.length} users processed`);
    }

    console.log(`Batch update complete: ${results.successful} successful, ${results.failed} failed`);
    return results;
}

/**
 * Schedule periodic stats updates for a user
 * This can be called when a user logs in or performs significant actions
 * @param {string} userId - User ID
 * @param {number} intervalMinutes - Update interval in minutes (default: 30)
 * @returns {Function} - Cleanup function to stop updates
 */
export function scheduleUserStatsUpdates(userId, intervalMinutes = 30) {
    // Initial update
    updateUserStats(userId);

    // Schedule periodic updates
    const intervalId = setInterval(() => {
        updateUserStats(userId);
    }, intervalMinutes * 60 * 1000);

    // Return cleanup function
    return () => {
        clearInterval(intervalId);
        console.log(`Stopped scheduled updates for user: ${userId}`);
    };
}

export default {
    updateUserStats,
    batchUpdateUserStats,
    scheduleUserStatsUpdates
};
