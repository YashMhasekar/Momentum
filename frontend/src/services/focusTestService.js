// ═══════════════════════════════════════════════════════════════════════════
// FOCUS TEST SERVICE
// Manages focus test data in Firestore
// ═══════════════════════════════════════════════════════════════════════════

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { triggerMomentumUpdate } from './momentumScoreEngine';

// ═══════════════════════════════════════════════════════════════════════════
// FOCUS TEST CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new focus test
 * @param {Object} testData - Test data
 * @returns {Promise<string>} - Test ID
 */
export async function createFocusTest(testData) {
  try {
    const {
      userId,
      sessionId,
      studyTopic,
      normalizedTopic,
      category,
      difficulty,
      questions,
      focusDuration
    } = testData;

    const testRef = collection(db, 'focusTests');
    const docRef = await addDoc(testRef, {
      userId,
      sessionId: sessionId || null,
      studyTopic,
      normalizedTopic,
      category: category || 'General',
      difficulty: difficulty || 'Intermediate',
      questions,
      answers: {},
      score: null,
      confidence: null,
      learningQuality: null,
      feedback: null,
      passed: null,
      evaluations: [],
      focusDuration: focusDuration || 0,
      status: 'in-progress',
      createdAt: serverTimestamp(),
      completedAt: null
    });

    console.log('✅ Focus test created:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('❌ Error creating focus test:', error);
    throw error;
  }
}

/**
 * Submit focus test answers
 * @param {string} testId - Test ID
 * @param {Object} answers - User answers
 * @param {Object} evaluation - Evaluation results
 * @returns {Promise<void>}
 */
export async function submitFocusTest(testId, answers, evaluation) {
  try {
    const testRef = doc(db, 'focusTests', testId);
    const testDoc = await getDoc(testRef);

    if (!testDoc.exists()) {
      throw new Error('Test not found');
    }

    const testData = testDoc.data();

    // Update test with answers and evaluation
    await updateDoc(testRef, {
      answers,
      score: evaluation.totalScore,
      confidence: evaluation.confidence,
      learningQuality: evaluation.learningQuality,
      feedback: evaluation.feedback,
      passed: evaluation.passed,
      evaluations: evaluation.evaluations,
      status: 'completed',
      completedAt: serverTimestamp()
    });

    // Update user stats
    const userRef = doc(db, 'users', testData.userId);
    await updateDoc(userRef, {
      totalFocusTests: increment(1),
      totalFocusTestScore: increment(evaluation.totalScore),
      lastFocusTestAt: serverTimestamp()
    });

    // Update momentum score based on test performance
    await updateMomentumFromTest(testData.userId, evaluation);

    console.log('✅ Focus test submitted:', testId);

  } catch (error) {
    console.error('❌ Error submitting focus test:', error);
    throw error;
  }
}

/**
 * Get focus tests for user
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of tests to fetch
 * @returns {Promise<Array>} - Array of tests
 */
export async function getUserFocusTests(userId, limitCount = 20) {
  try {
    const testsRef = collection(db, 'focusTests');
    const q = query(
      testsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const tests = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tests.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        completedAt: data.completedAt?.toDate()
      });
    });

    return tests;

  } catch (error) {
    console.error('❌ Error fetching focus tests:', error);
    return [];
  }
}

/**
 * Get focus test statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Statistics
 */
export async function getFocusTestStatistics(userId) {
  try {
    const tests = await getUserFocusTests(userId, 100);

    const completedTests = tests.filter(t => t.status === 'completed');
    const totalTests = completedTests.length;

    if (totalTests === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        passRate: 0,
        strongestSubjects: [],
        weakestSubjects: [],
        improvementTrend: 'stable',
        learningConsistency: 0
      };
    }

    // Calculate average score
    const averageScore = Math.round(
      completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / totalTests
    );

    // Calculate pass rate
    const passedTests = completedTests.filter(t => t.passed).length;
    const passRate = Math.round((passedTests / totalTests) * 100);

    // Find strongest and weakest subjects
    const subjectScores = {};
    completedTests.forEach(test => {
      const subject = test.normalizedTopic || test.studyTopic;
      if (!subjectScores[subject]) {
        subjectScores[subject] = { total: 0, count: 0 };
      }
      subjectScores[subject].total += test.score || 0;
      subjectScores[subject].count += 1;
    });

    const subjects = Object.entries(subjectScores).map(([subject, data]) => ({
      subject,
      averageScore: Math.round(data.total / data.count),
      testCount: data.count
    }));

    subjects.sort((a, b) => b.averageScore - a.averageScore);

    const strongestSubjects = subjects.slice(0, 3);
    const weakestSubjects = subjects.slice(-3).reverse();

    // Calculate improvement trend
    const recentTests = completedTests.slice(0, 5);
    const olderTests = completedTests.slice(5, 10);

    let improvementTrend = 'stable';
    if (recentTests.length > 0 && olderTests.length > 0) {
      const recentAvg = recentTests.reduce((sum, t) => sum + (t.score || 0), 0) / recentTests.length;
      const olderAvg = olderTests.reduce((sum, t) => sum + (t.score || 0), 0) / olderTests.length;

      if (recentAvg > olderAvg + 10) improvementTrend = 'improving';
      else if (recentAvg < olderAvg - 10) improvementTrend = 'declining';
    }

    // Calculate learning consistency (tests per week)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const testsThisWeek = completedTests.filter(t => 
      t.completedAt && t.completedAt > oneWeekAgo
    ).length;

    return {
      totalTests,
      averageScore,
      passRate,
      strongestSubjects,
      weakestSubjects,
      improvementTrend,
      learningConsistency: testsThisWeek
    };

  } catch (error) {
    console.error('❌ Error calculating statistics:', error);
    return {
      totalTests: 0,
      averageScore: 0,
      passRate: 0,
      strongestSubjects: [],
      weakestSubjects: [],
      improvementTrend: 'stable',
      learningConsistency: 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MOMENTUM INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update momentum score based on test performance
 */
async function updateMomentumFromTest(userId, evaluation) {
  try {
    const userRef = doc(db, 'users', userId);

    // Calculate momentum points based on score
    let momentumPoints = 0;

    if (evaluation.totalScore >= 90) {
      momentumPoints = 50; // Excellent
    } else if (evaluation.totalScore >= 75) {
      momentumPoints = 35; // Good
    } else if (evaluation.totalScore >= 60) {
      momentumPoints = 20; // Pass
    } else {
      momentumPoints = 10; // Participation
    }

    // Bonus for high learning quality
    if (evaluation.learningQuality === 'excellent') {
      momentumPoints += 10;
    } else if (evaluation.learningQuality === 'good') {
      momentumPoints += 5;
    }

    // Update momentum score
    await updateDoc(userRef, {
      momentumScore: increment(momentumPoints)
    });

    // Trigger full momentum recalculation
    await triggerMomentumUpdate(userId);

    console.log('✅ Momentum updated:', momentumPoints, 'points');

  } catch (error) {
    console.error('❌ Error updating momentum:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  createFocusTest,
  submitFocusTest,
  getUserFocusTests,
  getFocusTestStatistics
};
