'use client'

import { useDispatch, useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { useRef, useCallback, useEffect } from 'react'
import { RootState } from '@/store/store'
import { 
  setSearchQuery, 
  setCompanyFilter, 
  setLocationFilter, 
  setTypeFilter, 
  setExperienceFilter,
  clearFilters 
} from '@/store/slices/jobsSlice'
import { jobsApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X, Filter, Sparkles } from 'lucide-react'

export default function SearchFilters() {
  const dispatch = useDispatch()
  const { filters } = useSelector((state: RootState) => state.jobs)
  const inputRef = useRef<HTMLInputElement>(null)

  // Memoize the search handler to prevent re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart
    
    // Store cursor position and focus state
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        if (cursorPosition !== null) {
          inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
        }
      }
    }, 0)
    
    dispatch(setSearchQuery(value))
  }, [dispatch])

  // Maintain focus on search input after state updates
  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart
      // Use a microtask to ensure the DOM has updated
      queueMicrotask(() => {
        if (inputRef.current && document.activeElement === inputRef.current) {
          if (cursorPosition !== null) {
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition)
          }
        }
      })
    }
  }, [filters.query])

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: jobsApi.getCompanies,
  })

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: jobsApi.getLocations,
  })

  const { data: jobTypes = [] } = useQuery({
    queryKey: ['jobTypes'],
    queryFn: jobsApi.getJobTypes,
  })

  const { data: experienceLevels = [] } = useQuery({
    queryKey: ['experienceLevels'],
    queryFn: jobsApi.getExperienceLevels,
  })

  const hasActiveFilters = filters.query || filters.company || filters.location || filters.type || filters.experience

  return (
    <div className="gradient-card p-6 rounded-xl shadow-2xl border border-primary/20 mb-8 hover-lift" key="search-filters-container">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg animate-glow">
          <Filter className="h-5 w-5 text-black" />
        </div>
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
          Search & Filter Jobs
          <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
        </h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Search Input */}
        <div className="relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <Input
            ref={inputRef}
            placeholder="Search jobs, companies..."
            value={filters.query}
            onChange={handleSearchChange}
            className="pl-10 bg-secondary/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 hover:bg-secondary/70"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* Company Filter */}
        <Select
          value={filters.company}
          onValueChange={(value) => dispatch(setCompanyFilter(value === 'all' ? '' : value))}
        >
          <SelectTrigger className="bg-secondary/50 border-primary/20 hover:bg-secondary/70 focus:border-primary transition-all duration-300">
            <SelectValue placeholder="Select Company" />
          </SelectTrigger>
          <SelectContent className="gradient-card border-primary/20">
            <SelectItem value="all" className="hover:bg-primary/20">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company} value={company} className="hover:bg-primary/20">
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location Filter */}
        <Select
          value={filters.location}
          onValueChange={(value) => dispatch(setLocationFilter(value === 'all' ? '' : value))}
        >
          <SelectTrigger className="bg-secondary/50 border-primary/20 hover:bg-secondary/70 focus:border-primary transition-all duration-300">
            <SelectValue placeholder="Select Location" />
          </SelectTrigger>
          <SelectContent className="gradient-card border-primary/20">
            <SelectItem value="all" className="hover:bg-primary/20">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location} className="hover:bg-primary/20">
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Job Type Filter */}
        <Select
          value={filters.type}
          onValueChange={(value) => dispatch(setTypeFilter(value === 'all' ? '' : value))}
        >
          <SelectTrigger className="bg-secondary/50 border-primary/20 hover:bg-secondary/70 focus:border-primary transition-all duration-300">
            <SelectValue placeholder="Select Job Type" />
          </SelectTrigger>
          <SelectContent className="gradient-card border-primary/20">
            <SelectItem value="all" className="hover:bg-primary/20">All Types</SelectItem>
            {jobTypes.map((type) => (
              <SelectItem key={type} value={type} className="hover:bg-primary/20">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Experience Level Filter */}
        <Select
          value={filters.experience}
          onValueChange={(value) => dispatch(setExperienceFilter(value === 'all' ? '' : value))}
        >
          <SelectTrigger className="bg-secondary/50 border-primary/20 hover:bg-secondary/70 focus:border-primary transition-all duration-300">
            <SelectValue placeholder="Experience Level" />
          </SelectTrigger>
          <SelectContent className="gradient-card border-primary/20">
            <SelectItem value="all" className="hover:bg-primary/20">All Levels</SelectItem>
            {experienceLevels.map((level) => (
              <SelectItem key={level} value={level} className="hover:bg-primary/20">
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end mt-6 animate-slide-in-right">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(clearFilters())}
            className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300 animate-glow"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
