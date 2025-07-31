'use client'

import { useDispatch, useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { RootState } from '@/store/store'
import { 
  setSearchQuery, 
  setCompanyFilter, 
  setLocationFilter, 
  setTypeFilter, 
  clearFilters 
} from '@/store/slices/jobsSlice'
import { jobsApi } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, X } from 'lucide-react'

export default function SearchFilters() {
  const dispatch = useDispatch()
  const { searchQuery, companyFilter, locationFilter, typeFilter } = useSelector(
    (state: RootState) => state.jobs
  )

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: jobsApi.getCompanies,
  })

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: jobsApi.getLocations,
  })

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']

  const hasActiveFilters = searchQuery || companyFilter || locationFilter || typeFilter

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search jobs, companies..."
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="pl-10"
          />
        </div>

        {/* Company Filter */}
        <Select
          value={companyFilter}
          onValueChange={(value) => dispatch(setCompanyFilter(value === 'all' ? '' : value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location Filter */}
        <Select
          value={locationFilter}
          onValueChange={(value) => dispatch(setLocationFilter(value === 'all' ? '' : value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Job Type Filter */}
        <Select
          value={typeFilter}
          onValueChange={(value) => dispatch(setTypeFilter(value === 'all' ? '' : value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Job Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {jobTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(clearFilters())}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
