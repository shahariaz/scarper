import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Job {
  id: number
  title: string
  company: string
  location: string
  job_type: string
  posted_date: string
  scraped_at: string
  apply_link: string
  status: string
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  salary?: string
  experience_level?: string
  skills?: string
}

export interface PaginationInfo {
  total: number
  page: number
  per_page: number
  pages: number
}

export interface SearchFilters {
  query: string
  company: string
  location: string
  type: string
  experience: string
}

interface JobsState {
  jobs: Job[]
  selectedJob: Job | null
  filters: SearchFilters
  pagination: PaginationInfo
  loading: boolean
  error: string | null
}

const initialState: JobsState = {
  jobs: [],
  selectedJob: null,
  filters: {
    query: '',
    company: '',
    location: '',
    type: '',
    experience: '',
  },
  pagination: {
    total: 0,
    page: 1,
    per_page: 20,
    pages: 0,
  },
  loading: false,
  error: null,
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobsData: (state, action: PayloadAction<{ jobs: Job[]; pagination: PaginationInfo }>) => {
      state.jobs = action.payload.jobs
      state.pagination = action.payload.pagination
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.query = action.payload
      state.pagination.page = 1 // Reset to first page when searching
    },
    setCompanyFilter: (state, action: PayloadAction<string>) => {
      state.filters.company = action.payload
      state.pagination.page = 1 // Reset to first page when filtering
    },
    setLocationFilter: (state, action: PayloadAction<string>) => {
      state.filters.location = action.payload
      state.pagination.page = 1 // Reset to first page when filtering
    },
    setTypeFilter: (state, action: PayloadAction<string>) => {
      state.filters.type = action.payload
      state.pagination.page = 1 // Reset to first page when filtering
    },
    setExperienceFilter: (state, action: PayloadAction<string>) => {
      state.filters.experience = action.payload
      state.pagination.page = 1 // Reset to first page when filtering
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
    setPerPage: (state, action: PayloadAction<number>) => {
      state.pagination.per_page = action.payload
      state.pagination.page = 1 // Reset to first page when changing per page
    },
    clearFilters: (state) => {
      state.filters = {
        query: '',
        company: '',
        location: '',
        type: '',
        experience: '',
      }
      state.pagination.page = 1
    },
  },
})

export const {
  setJobsData,
  setLoading,
  setError,
  setSelectedJob,
  setSearchQuery,
  setCompanyFilter,
  setLocationFilter,
  setTypeFilter,
  setExperienceFilter,
  setPage,
  setPerPage,
  clearFilters,
} = jobsSlice.actions

export default jobsSlice.reducer
