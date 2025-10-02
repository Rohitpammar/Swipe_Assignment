import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { parseResume, validateEmail, validatePhone } from '../utils';
import { v4 as uuidv4 } from 'uuid';

const initialState = {
  profile: {
    id: null,
    name: null,
    email: null,
    phone: null,
    resumeFileName: null,
    resumeText: null,
    uploadedAt: null,
    // Interview scoring fields
    finalScore: null,
    maxScore: null,
    scorePercentage: null,
    interviewSummary: null,
    interviewCompletedAt: null,
  },
  isProfileComplete: false,
  validationErrors: {},
  isUploading: false,
  uploadError: null,
};

export const uploadAndParseResume = createAsyncThunk(
  'candidate/uploadAndParseResume',
  async (file, { rejectWithValue }) => {
    const result = await parseResume(file);
    if (result.error) return rejectWithValue(result.error);
    const { name, email, phone, resumeText } = result;
    return {
      id: uuidv4(),
      name,
      email,
      phone,
      resumeFileName: file.name,
      resumeText,
      uploadedAt: new Date().toISOString(),
    };
  }
);

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    setProfile(state, action) {
      state.profile = { ...state.profile, ...action.payload };
    },
    updateProfileField(state, action) {
      const { field, value } = action.payload;
      state.profile[field] = value;
    },
    setValidationErrors(state, action) {
      state.validationErrors = action.payload;
    },
    setIsUploading(state, action) {
      state.isUploading = action.payload;
    },
    setUploadError(state, action) {
      state.uploadError = action.payload;
    },
    validateProfile(state) {
      const errors = {};
      const { name, email, phone } = state.profile;
      if (!name || name.length < 2) errors.name = 'Name is required.';
      if (!email || !validateEmail(email)) errors.email = 'Valid email required.';
      if (!phone || !validatePhone(phone)) errors.phone = 'Valid phone required.';
      state.validationErrors = errors;
      state.isProfileComplete = Object.keys(errors).length === 0;
    },
    saveFinalScore(state, action) {
      const { finalScore, maxScore, scorePercentage, summary, completedAt } = action.payload;
      state.profile.finalScore = finalScore;
      state.profile.maxScore = maxScore;
      state.profile.scorePercentage = scorePercentage;
      state.profile.interviewSummary = summary;
      state.profile.interviewCompletedAt = completedAt;
    },
    resetCandidate() {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(uploadAndParseResume.pending, state => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadAndParseResume.fulfilled, (state, action) => {
        state.isUploading = false;
        state.uploadError = null;
        state.profile = action.payload;
      })
      .addCase(uploadAndParseResume.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload || 'Failed to parse resume.';
      });
  },
});


export const {
  setProfile,
  updateProfileField,
  setValidationErrors,
  setIsUploading,
  setUploadError,
  validateProfile,
  saveFinalScore,
  resetCandidate,
} = candidateSlice.actions;


export const selectCandidateProfile = state => state.candidate.profile;
export const selectIsProfileComplete = state => state.candidate.isProfileComplete;
export const selectValidationErrors = state => state.candidate.validationErrors;
export const selectIsUploading = state => state.candidate.isUploading;
export const selectUploadError = state => state.candidate.uploadError;
export const selectCandidateScore = state => ({
  finalScore: state.candidate.profile.finalScore,
  maxScore: state.candidate.profile.maxScore,
  scorePercentage: state.candidate.profile.scorePercentage,
  summary: state.candidate.profile.interviewSummary,
  completedAt: state.candidate.profile.interviewCompletedAt,
});

export default candidateSlice.reducer;
