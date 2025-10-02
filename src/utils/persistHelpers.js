/**
 * Persistence helper utilities for redux-persist and localStorage
 * @module persistHelpers
 */

/**
 * Handle persistence/storage errors and return user-friendly messages.
 * @param {Error} error
 * @returns {string} User-friendly error message
 */
export function handlePersistError(error) {
  let msg = 'Failed to save progress. Your session may not be restored if you close this page.';
  if (!error) return msg;
  const str = error.message || error.toString();
  if (error.name === 'QuotaExceededError' || str.toLowerCase().includes('quota')) {
    msg = 'Storage quota exceeded. Please clear browser data or use a smaller resume file.';
  } else if (error.name === 'SecurityError' || str.toLowerCase().includes('security')) {
    msg = 'Unable to access browser storage. Please check your privacy settings.';
  } else if (str.toLowerCase().includes('corrupted') || str.toLowerCase().includes('parse')) {
    msg = 'Saved data is corrupted. Starting fresh session.';
  }
  console.error('Persistence error:', error);
  return msg;
}

/**
 * Test if localStorage is available and writable.
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, 'test');
    if (localStorage.getItem(testKey) !== 'test') return false;
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get approximate size of localStorage in KB.
 * @returns {number}
 */
export function getStorageSize() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const val = localStorage.getItem(key);
    total += (key.length + (val ? val.length : 0));
  }
  return Math.round(total / 1024);
}

/**
 * Clear only interview-related data from localStorage (redux-persist root).
 * @returns {boolean}
 */
export function clearInterviewStorage() {
  try {
    localStorage.removeItem('persist:root');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validate persisted state structure and data types.
 * @param {object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateStoredData(data) {
  const errors = [];
  if (!data) return { isValid: false, errors: ['No data found'] };
  // Candidate profile
  if (data.candidate && data.candidate.profile) {
    const p = data.candidate.profile;
    if (p.id && !/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(p.id)) {
      errors.push('Invalid candidate id');
    }
    if (p.uploadedAt && isNaN(Date.parse(p.uploadedAt))) {
      errors.push('Invalid uploadedAt timestamp');
    }
    if (p.interviewCompletedAt && isNaN(Date.parse(p.interviewCompletedAt))) {
      errors.push('Invalid interviewCompletedAt timestamp');
    }
    if (p.finalScore && (typeof p.finalScore !== 'number' || p.finalScore < 0)) {
      errors.push('Invalid finalScore');
    }
  }
  // Interview
  if (data.interview) {
    if (data.interview.questions && !Array.isArray(data.interview.questions)) {
      errors.push('Interview questions not an array');
    }
    if (data.interview.scores && !Array.isArray(data.interview.scores)) {
      errors.push('Interview scores not an array');
    }
    if (data.interview.totalScore && (typeof data.interview.totalScore !== 'number' || data.interview.totalScore < 0)) {
      errors.push('Invalid interview totalScore');
    }
  }
  return { isValid: errors.length === 0, errors };
}
