// AI scoring and summary utilities (placeholder/mock)

const KEYWORDS = {
  React: ['component', 'state', 'props', 'hook', 'useEffect', 'render', 'virtual', 'memo'],
  'Node.js': ['server', 'async', 'middleware', 'express', 'request', 'response', 'event'],
  'System Design': ['scalability', 'database', 'API', 'authentication', 'real-time', 'storage', 'message'],
};

const DIFFICULTY_WEIGHTS = {
  Easy: 1,
  Medium: 1.5,
  Hard: 2,
};

export function evaluateAnswer(question, answer, timeSpent, difficulty) {
  let baseScore = 0;
  const ans = (answer || '').trim();
  // Length-based scoring
  if (!ans || ans.length < 10) baseScore = 1 + Math.floor(ans.length / 10);
  else if (ans.length < 50) baseScore = 3 + Math.floor(ans.length / 10);
  else if (ans.length < 150) baseScore = 5 + Math.floor(ans.length / 25);
  else baseScore = 7 + Math.min(3, Math.floor(ans.length / 100));
  // Keyword bonus
  const cat = question.category;
  const keywords = KEYWORDS[cat] || [];
  let keywordHits = 0;
  for (const kw of keywords) {
    if (ans.toLowerCase().includes(kw)) keywordHits++;
  }
  baseScore += Math.min(2, keywordHits);
  // Time bonus
  if (question.timeLimit && timeSpent < question.timeLimit / 2) baseScore += 1;
  // Clamp baseScore
  baseScore = Math.max(0, Math.min(10, baseScore));
  // Difficulty weighting
  const weight = DIFFICULTY_WEIGHTS[difficulty] || 1;
  const weightedScore = Math.round(baseScore * weight * 10) / 10;
  // Feedback
  let feedback = '';
  if (baseScore <= 3) feedback = 'Needs significant improvement. Answer lacks depth and key concepts.';
  else if (baseScore <= 6) feedback = 'Fair answer. Covers some basics but missing important details.';
  else if (baseScore <= 8) feedback = 'Good answer. Demonstrates solid understanding with room for elaboration.';
  else feedback = 'Excellent answer. Comprehensive and well-articulated.';
  // Strengths
  const strengths = [];
  if (keywordHits > 0) strengths.push('Mentioned key concepts');
  if (ans.length > 100) strengths.push('Detailed explanation');
  if (timeSpent < (question.timeLimit || 60) / 2) strengths.push('Quick response');
  if (baseScore >= 7) strengths.push('Clear and concise');
  // Improvements
  const improvements = [];
  if (keywordHits === 0) improvements.push('Add more relevant technical terms');
  if (ans.length < 50) improvements.push('Provide more detail/examples');
  if (baseScore < 7) improvements.push('Explain reasoning and trade-offs');
  if (baseScore < 4) improvements.push('Review core concepts');
  return {
    score: Math.round(baseScore * 10) / 10,
    weightedScore,
    feedback,
    strengths,
    improvements,
  };
}

export function generateInterviewSummary(answers, scores, totalScore, maxScore) {
  const percentage = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
  let rating = 'Needs Improvement';
  if (percentage >= 90) rating = 'Excellent';
  else if (percentage >= 75) rating = 'Good';
  else if (percentage >= 60) rating = 'Fair';
  // Strengths/weaknesses aggregation
  const allStrengths = scores.flatMap(s => s.strengths).filter(Boolean);
  const allImprovements = scores.flatMap(s => s.improvements).filter(Boolean);
  const overallStrengths = Array.from(new Set(allStrengths)).slice(0, 5);
  const overallWeaknesses = Array.from(new Set(allImprovements)).slice(0, 5);
  // Category breakdown
  const catScores = {};
  answers.forEach((a, i) => {
    const qCat = a.category || (a.question && a.question.category) || 'Other';
    if (!catScores[qCat]) catScores[qCat] = { total: 0, count: 0 };
    catScores[qCat].total += scores[i]?.weightedScore || 0;
    catScores[qCat].count++;
  });
  const categoryBreakdown = Object.entries(catScores).map(([cat, { total, count }]) => ({
    category: cat,
    avgScore: count ? Math.round((total / count) * 10) / 10 : 0,
  }));
  // Recommendation
  let recommendation = 'No Hire - Significant gaps in technical knowledge';
  if (percentage >= 80) recommendation = 'Strong Hire - Candidate demonstrates excellent technical knowledge';
  else if (percentage >= 65) recommendation = 'Hire - Candidate shows good understanding with minor gaps';
  else if (percentage >= 50) recommendation = 'Maybe - Candidate has potential but needs development';
  // Time management
  const avgTime = answers.length ? Math.round(answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / answers.length) : 0;
  const avgLimit = answers.length ? Math.round(answers.reduce((sum, a) => sum + ((a.timeLimit) || 60), 0) / answers.length) : 0;
  const timeManagement = avgTime < avgLimit * 0.7 ? 'Excellent time management' : avgTime < avgLimit ? 'Good time management' : 'Could improve time management';
  return {
    rating,
    percentage,
    overallStrengths,
    overallWeaknesses,
    categoryBreakdown,
    recommendation,
    timeManagement,
  };
}

export function calculateMaxScore(questions) {
  if (!questions || !questions.length) return 0;
  return questions.reduce((sum, q) => {
    const weight = DIFFICULTY_WEIGHTS[q.difficulty] || 1;
    return sum + Math.round(10 * weight);
  }, 0);
}
