import { configureStore } from '@reduxjs/toolkit'
import jobsSlice from './slices/jobsSlice'

export const store = configureStore({
  reducer: {
    jobs: jobsSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
