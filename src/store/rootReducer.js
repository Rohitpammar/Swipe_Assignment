

import { combineReducers } from '@reduxjs/toolkit';
import candidateReducer from './candidateSlice';
import interviewReducer from './interviewSlice';
import candidatesReducer from './candidatesSlice';


const rootReducer = combineReducers({
  candidate: candidateReducer,
  interview: interviewReducer,
  candidates: candidatesReducer,
});

export default rootReducer;
