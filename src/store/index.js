
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import rootReducer from './rootReducer';
import { handlePersistError } from '../utils/persistHelpers';

const persistConfig = {
  key: 'root',
  storage,
  timeout: 10000,
  debug: false,
  whitelist: ['candidate', 'interview', 'candidates'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: [
          'interview.timerStartedAt',
          'interview.interviewStartedAt',
          'interview.interviewCompletedAt',
        ],
      },
    }),
});

export const persistor = persistStore(store);

// Listen for persist/rehydrate errors
try {
  persistor.subscribe(() => {
    // Could add more advanced error handling here
  });
} catch (err) {
  handlePersistError(err);
}


