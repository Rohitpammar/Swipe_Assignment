import { createSlice, createSelector } from '@reduxjs/toolkit';

// Helper functions
const sortCandidates = (candidates, sortBy, sortOrder) => {
  const sorted = [...candidates];
  sorted.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (sortBy === 'name') {
      aVal = (aVal || '').toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    if (sortBy === 'completedAt' || sortBy === 'interviewCompletedAt') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
};

const filterBySearch = (candidates, query) => {
  if (!query) return candidates;
  const q = query.toLowerCase();
  return candidates.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q) ||
    (c.phone || '').toLowerCase().includes(q)
  );
};

const filterByRating = (candidates, rating) => {
  if (!rating || rating === 'All') return candidates;
  return candidates.filter(c => c.rating === rating);
};

const initialState = {
  candidates: [],
  searchQuery: '',
  sortBy: 'scorePercentage',
  sortOrder: 'desc',
  filterRating: 'All',
};

const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    addCompletedCandidate(state, action) {
      const newCandidate = action.payload;
      const idx = state.candidates.findIndex(c => c.id === newCandidate.id);
      if (idx !== -1) {
        state.candidates[idx] = newCandidate;
      } else {
        state.candidates.push(newCandidate);
      }
      // Always sort after add/update
      state.candidates = sortCandidates(state.candidates, state.sortBy, state.sortOrder);
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setSortBy(state, action) {
      state.sortBy = action.payload;
      state.candidates = sortCandidates(state.candidates, state.sortBy, state.sortOrder);
    },
    setSortOrder(state, action) {
      state.sortOrder = action.payload;
      state.candidates = sortCandidates(state.candidates, state.sortBy, state.sortOrder);
    },
    setFilterRating(state, action) {
      state.filterRating = action.payload;
    },
    removeCandidate(state, action) {
      state.candidates = state.candidates.filter(c => c.id !== action.payload);
    },
    clearAllCandidates(state) {
      state.candidates = [];
    },
  },
});

// Selectors
export const selectAllCandidates = state => state.candidates.candidates;
export const selectCandidateById = (state, id) => state.candidates.candidates.find(c => c.id === id);
export const selectSearchQuery = state => state.candidates.searchQuery;
export const selectSortConfig = state => ({ sortBy: state.candidates.sortBy, sortOrder: state.candidates.sortOrder });
export const selectFilterRating = state => state.candidates.filterRating;
export const selectCandidateCount = state => state.candidates.candidates.length;
export const selectTopCandidate = state => {
  if (!state.candidates.candidates.length) return null;
  return sortCandidates(state.candidates.candidates, 'scorePercentage', 'desc')[0];
};

export const selectFilteredAndSortedCandidates = createSelector(
  [selectAllCandidates, selectSearchQuery, selectSortConfig, selectFilterRating],
  (candidates, searchQuery, { sortBy, sortOrder }, filterRating) => {
    let filtered = filterBySearch(candidates, searchQuery);
    filtered = filterByRating(filtered, filterRating);
    return sortCandidates(filtered, sortBy, sortOrder);
  }
);

export const {
  addCompletedCandidate,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  setFilterRating,
  removeCandidate,
  clearAllCandidates,
} = candidatesSlice.actions;

export default candidatesSlice.reducer;
