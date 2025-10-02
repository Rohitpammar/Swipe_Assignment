// Question bank for React/Node full-stack interview
// Each question: { id, difficulty, timeLimit, question, category }

export const DIFFICULTY_TIME_LIMITS = {
  Easy: 20,
  Medium: 60,
  Hard: 120,
};

const QUESTIONS = [
  // Easy
  {
    id: 'q1',
    difficulty: 'Easy',
    timeLimit: DIFFICULTY_TIME_LIMITS.Easy,
    question: 'What is the difference between state and props in React?',
    category: 'React',
  },
  {
    id: 'q2',
    difficulty: 'Easy',
    timeLimit: DIFFICULTY_TIME_LIMITS.Easy,
    question: 'Explain what Node.js is and why it\'s used for backend development.',
    category: 'Node.js',
  },
  // Medium
  {
    id: 'q3',
    difficulty: 'Medium',
    timeLimit: DIFFICULTY_TIME_LIMITS.Medium,
    question: 'Explain the useEffect hook in React and when you would use it.',
    category: 'React',
  },
  {
    id: 'q4',
    difficulty: 'Medium',
    timeLimit: DIFFICULTY_TIME_LIMITS.Medium,
    question: 'How do you handle errors in Express middleware?',
    category: 'Node.js',
  },
  // Hard
  {
    id: 'q5',
    difficulty: 'Hard',
    timeLimit: DIFFICULTY_TIME_LIMITS.Hard,
    question: 'How would you optimize a React application with large lists? Discuss virtualization and memoization.',
    category: 'React',
  },
  {
    id: 'q6',
    difficulty: 'Hard',
    timeLimit: DIFFICULTY_TIME_LIMITS.Hard,
    question: 'Design a RESTful API for a real-time chat application. Discuss authentication, message storage, and scalability.',
    category: 'System Design',
  },
];

export function getInterviewQuestions() {
  // Return 2 Easy, 2 Medium, 2 Hard in order
  return [
    QUESTIONS[0],
    QUESTIONS[1],
    QUESTIONS[2],
    QUESTIONS[3],
    QUESTIONS[4],
    QUESTIONS[5],
  ];
}
