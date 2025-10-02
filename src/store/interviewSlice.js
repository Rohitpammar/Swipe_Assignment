
import { createSlice } from '@reduxjs/toolkit';
import { getInterviewQuestions } from '../utils/questions';
import { evaluateAnswer, generateInterviewSummary, calculateMaxScore } from '../utils/scoring';
import dayjs from 'dayjs';
// Selector: true if timer needs resume (active, timerStartedAt in past)
export const selectNeedsTimerResume = state => {
  const s = state.interview;
  if (!s.isInterviewActive || s.isInterviewComplete) return false;
  if (!s.timerStartedAt) return false;
  const started = dayjs(s.timerStartedAt);
  return started.isBefore(dayjs().subtract(2, 'second'));
};


const initialState = {
  candidateId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  currentAnswer: '',
  timerStartedAt: null,
  timeRemaining: 0,
  isInterviewActive: false,
  isInterviewComplete: false,
  interviewStartedAt: null,
  interviewCompletedAt: null,
  // Scoring
  scores: [],
  totalScore: 0,
  maxScore: 0,
  summary: null,
  isScoreCalculated: false,
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    /**
     * Resume the interview timer after a page reload by calculating elapsed time.
     * If timer has expired, set timeRemaining to 0 (auto-submit will be triggered by component).
     */
    resumeInterviewTimer(state) {
      if (!state.isInterviewActive || state.isInterviewComplete) return;
      if (!state.timerStartedAt) {
        state.timeRemaining = 0;
        return;
      }
      const now = dayjs();
      const started = dayjs(state.timerStartedAt);
      let elapsedSeconds = now.diff(started, 'second');
      if (isNaN(elapsedSeconds) || elapsedSeconds < 0) elapsedSeconds = 0;
      // If elapsed is huge (e.g., >1hr), consider session expired
      if (elapsedSeconds > 3600) {
        state.timeRemaining = 0;
        return;
      }
      state.timeRemaining = Math.max(0, state.timeRemaining - elapsedSeconds);
      state.timerStartedAt = now.toISOString();
    },
    startInterview(state, action) {
      state.candidateId = action.payload;
      state.questions = getInterviewQuestions();
      state.currentQuestionIndex = 0;
      state.answers = [];
      state.currentAnswer = '';
      state.timerStartedAt = dayjs().toISOString();
      state.timeRemaining = state.questions[0].timeLimit;
      state.isInterviewActive = true;
      state.isInterviewComplete = false;
      state.interviewStartedAt = dayjs().toISOString();
      state.interviewCompletedAt = null;
    },
    updateCurrentAnswer(state, action) {
      state.currentAnswer = action.payload;
    },
    submitAnswer(state) {
      if (!state.isInterviewActive || state.isInterviewComplete) return;
      const q = state.questions[state.currentQuestionIndex];
      const timeSpent = q.timeLimit - state.timeRemaining;
      state.answers.push({
        questionId: q.id,
        answer: state.currentAnswer,
        timeSpent,
        submittedAt: dayjs().toISOString(),
        difficulty: q.difficulty,
        question: q.question,
      });
      // Move to next question or complete
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        const nextQ = state.questions[state.currentQuestionIndex];
        state.currentAnswer = '';
        state.timerStartedAt = dayjs().toISOString();
        state.timeRemaining = nextQ.timeLimit;
      } else {
        state.isInterviewActive = false;
        state.isInterviewComplete = true;
        state.interviewCompletedAt = dayjs().toISOString();
        // Calculate scores immediately
        if (state.answers.length) {
          const scores = [];
          for (let i = 0; i < state.answers.length; i++) {
            const ans = state.answers[i];
            const qObj = state.questions.find(q => q.id === ans.questionId) || {};
            scores.push(evaluateAnswer(qObj, ans.answer, ans.timeSpent, ans.difficulty));
          }
          state.scores = scores;
          state.totalScore = scores.reduce((sum, s) => sum + (s.weightedScore || 0), 0);
          state.maxScore = calculateMaxScore(state.questions);
          state.summary = generateInterviewSummary(state.answers, scores, state.totalScore, state.maxScore);
          state.isScoreCalculated = true;
        }
      }
    },
    autoSubmitAnswer(state) {
      if (!state.isInterviewActive || state.isInterviewComplete) return;
      const q = state.questions[state.currentQuestionIndex];
      const timeSpent = q.timeLimit;
      state.answers.push({
        questionId: q.id,
        answer: state.currentAnswer || '',
        timeSpent,
        submittedAt: dayjs().toISOString(),
        difficulty: q.difficulty,
        question: q.question,
        autoSubmitted: true,
      });
      // Move to next question or complete
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        const nextQ = state.questions[state.currentQuestionIndex];
        state.currentAnswer = '';
        state.timerStartedAt = dayjs().toISOString();
        state.timeRemaining = nextQ.timeLimit;
      } else {
        state.isInterviewActive = false;
        state.isInterviewComplete = true;
        state.interviewCompletedAt = dayjs().toISOString();
        // Calculate scores immediately
        if (state.answers.length) {
          const scores = [];
          for (let i = 0; i < state.answers.length; i++) {
            const ans = state.answers[i];
            const qObj = state.questions.find(q => q.id === ans.questionId) || {};
            scores.push(evaluateAnswer(qObj, ans.answer, ans.timeSpent, ans.difficulty));
          }
          state.scores = scores;
          state.totalScore = scores.reduce((sum, s) => sum + (s.weightedScore || 0), 0);
          state.maxScore = calculateMaxScore(state.questions);
          state.summary = generateInterviewSummary(state.answers, scores, state.totalScore, state.maxScore);
          state.isScoreCalculated = true;
        }
      }
    },
    calculateScores(state) {
      if (!state.answers.length) return;
      const scores = [];
      for (let i = 0; i < state.answers.length; i++) {
        const ans = state.answers[i];
        const qObj = state.questions.find(q => q.id === ans.questionId) || {};
        scores.push(evaluateAnswer(qObj, ans.answer, ans.timeSpent, ans.difficulty));
      }
      state.scores = scores;
      state.totalScore = scores.reduce((sum, s) => sum + (s.weightedScore || 0), 0);
      state.maxScore = calculateMaxScore(state.questions);
      state.summary = generateInterviewSummary(state.answers, scores, state.totalScore, state.maxScore);
      state.isScoreCalculated = true;
    },
    decrementTimer(state) {
      if (!state.isInterviewActive || state.isInterviewComplete) return;
      if (state.timeRemaining > 0) {
        state.timeRemaining--;
      }
    },
    resetInterview() {
      return initialState;
    },
  },

});

export const {
  startInterview,
  updateCurrentAnswer,
  submitAnswer,
  autoSubmitAnswer,
  decrementTimer,
  resetInterview,
  calculateScores,
  resumeInterviewTimer,
} = interviewSlice.actions;

// Selectors

export const selectCurrentQuestion = state => state.interview.questions[state.interview.currentQuestionIndex];
export const selectCurrentAnswer = state => state.interview.currentAnswer;
export const selectTimeRemaining = state => state.interview.timeRemaining;
export const selectInterviewProgress = state => ({
  current: state.interview.currentQuestionIndex + 1,
  total: state.interview.questions.length,
});
export const selectIsInterviewActive = state => state.interview.isInterviewActive;
export const selectIsInterviewComplete = state => state.interview.isInterviewComplete;
export const selectAllAnswers = state => state.interview.answers;
export const selectInterviewStatus = state => ({
  isActive: state.interview.isInterviewActive,
  isComplete: state.interview.isInterviewComplete,
  startedAt: state.interview.interviewStartedAt,
  completedAt: state.interview.interviewCompletedAt,
});
export const selectScores = state => state.interview.scores;
export const selectTotalScore = state => state.interview.totalScore;
export const selectMaxScore = state => state.interview.maxScore;
export const selectSummary = state => state.interview.summary;
export const selectScorePercentage = state => state.interview.maxScore ? Math.round((state.interview.totalScore / state.interview.maxScore) * 100) : 0;
export const selectIsScoreCalculated = state => state.interview.isScoreCalculated;

export default interviewSlice.reducer;
