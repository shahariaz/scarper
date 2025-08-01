import { configureStore } from '@reduxjs/toolkit'
import jobsReducer from './slices/jobsSlice'
import authReducer from './slices/authSlice'
import blogsReducer from './slices/blogsSlice'
import socialReducer from './slices/socialSlice'

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    auth: authReducer,
    blogs: blogsReducer,
    social: socialReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
