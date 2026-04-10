import { configureStore } from '@reduxjs/toolkit';
import timezoneReducer from './slices/timezoneSlice';

export const store = configureStore({
  reducer: {
    timezone: timezoneReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // SQLite promises are not plain-serializable objects; disable the check
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
