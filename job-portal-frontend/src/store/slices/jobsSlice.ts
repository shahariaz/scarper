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
  benefits?: string
  salary?: string
}

interface JobsState {
  jobs: Job[]
  filteredJobs: Job[]
  selectedJob: Job | null
  searchQuery: string
  companyFilter: string
  locationFilter: string
  typeFilter: string
  loading: boolean
  error: string | null
}

const initialState: JobsState = {
  jobs: [],
  filteredJobs: [],
  selectedJob: null,
  searchQuery: '',
  companyFilter: '',
  locationFilter: '',
  typeFilter: '',
  loading: false,
  error: null,
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.jobs = action.payload
      state.filteredJobs = action.payload
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
      state.searchQuery = action.payload
      state.filteredJobs = filterJobs(state)
    },
    setCompanyFilter: (state, action: PayloadAction<string>) => {
      state.companyFilter = action.payload
      state.filteredJobs = filterJobs(state)
    },
    setLocationFilter: (state, action: PayloadAction<string>) => {
      state.locationFilter = action.payload
      state.filteredJobs = filterJobs(state)
    },
    setTypeFilter: (state, action: PayloadAction<string>) => {
      state.typeFilter = action.payload
      state.filteredJobs = filterJobs(state)
    },
    clearFilters: (state) => {
      state.searchQuery = ''
      state.companyFilter = ''
      state.locationFilter = ''
      state.typeFilter = ''
      state.filteredJobs = state.jobs
    },
  },
})

function filterJobs(state: JobsState): Job[] {
  return state.jobs.filter(job => {
    const matchesSearch = !state.searchQuery || 
      job.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(state.searchQuery.toLowerCase())
    
    const matchesCompany = !state.companyFilter || job.company === state.companyFilter
    const matchesLocation = !state.locationFilter || job.location === state.locationFilter
    const matchesType = !state.typeFilter || job.job_type === state.typeFilter
    
    return matchesSearch && matchesCompany && matchesLocation && matchesType
  })
}

export const {
  setJobs,
  setLoading,
  setError,
  setSelectedJob,
  setSearchQuery,
  setCompanyFilter,
  setLocationFilter,
  setTypeFilter,
  clearFilters,
} = jobsSlice.actions

export default jobsSlice.reducer
