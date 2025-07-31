import { configureStore } from '@reduxjs/toolkit'
import jobsReducer from './slices/jobsSlice'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
