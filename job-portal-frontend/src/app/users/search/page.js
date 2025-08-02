'use client'

import { useState, useEffect, useCallback } from 'react'

export default function UserSearchPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userType, setUserType] = useState('')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalUsers, setTotalUsers] = useState(0)

  const searchUsers = useCallback(async (page = 1, resetResults = true) => {
    if (resetResults) {
      setLoading(true)
      setUsers([])
      setCurrentPage(1)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (userType) params.set('user_type', userType)
      if (location.trim()) params.set('location', location.trim())
      if (industry.trim()) params.set('industry', industry.trim())
      
      params.set('page', page.toString())  
      params.set('per_page', '12')

      const response = await fetch(`http://localhost:5000/api/users/search?${params}`)
      const data = await response.json()
      
      if (data.success) {
        if (resetResults) {
          setUsers(data.users)
        } else {
          setUsers(prev => [...prev, ...data.users])
        }
        setHasMore(data.pagination.has_next)
        setTotalUsers(data.pagination.total)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery, userType, location, industry])

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading) return
    searchUsers(currentPage + 1, false)
  }, [hasMore, loadingMore, loading, currentPage, searchUsers])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(1, true)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchUsers])

  // Scroll event listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 1000 &&
        !loadingMore && 
        !loading && 
        hasMore
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore, hasMore, loading, loadingMore])

  // Initial load
  useEffect(() => {
    searchUsers(1, true)
  }, [searchUsers])

  const handleSearch = (e) => {
    e.preventDefault()
    searchUsers(1, true)
  }

  const getUserTypeColor = (type) => {
    switch (type) {
      case 'company':
        return 'bg-blue-100 text-blue-800'
      case 'jobseeker':
        return 'bg-green-100 text-green-800'
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Find People 🚀
          </h1>

          {/* Advanced Search Form */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="lg:col-span-2">
                  <input
                    type="text"
                    placeholder="Search by name, email, company, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                  />
                </div>
                <select 
                  value={userType} 
                  onChange={(e) => setUserType(e.target.value)}
                  className="px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                >
                  <option value="">All Types</option>
                  <option value="jobseeker">Job Seekers</option>
                  <option value="company">Companies</option>
                </select>
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="px-4 py-3 bg-gray-900/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-gray-900 font-semibold px-6 py-3 rounded-lg transition-all"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
          </div>

          {/* Search Results Summary */}
          {!loading && totalUsers > 0 && (
            <div className="mb-6">
              <p className="text-gray-400">
                Showing {users.length} of {totalUsers} users
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>
          )}

          {/* Results Grid with Infinite Scroll */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user, index) => (
              <div 
                key={`${user.id}-${index}`}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:shadow-lg hover:border-yellow-400/20 transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-gray-900 font-semibold">
                    {user.user_type === 'company' 
                      ? (user.company_name?.[0] || user.email[0]).toUpperCase()
                      : (user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.email[0].toUpperCase()
                    }
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getUserTypeColor(user.user_type)}`}>
                        {user.user_type}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-white mb-1">
                      {user.user_type === 'company' ? user.company_name : user.display_name}
                    </h3>
                    
                    {user.current_position && (
                      <p className="text-sm text-gray-400 truncate">{user.current_position}</p>
                    )}
                    
                    {user.industry && (
                      <p className="text-sm text-gray-400 truncate">{user.industry}</p>
                    )}
                    
                    {user.location && (
                      <p className="text-sm text-gray-400 truncate">{user.location}</p>
                    )}
                    
                    {user.bio && (
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">{user.bio}</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <a 
                    href={`/users/${user.id}`} 
                    className="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-white text-center px-4 py-2 rounded-lg transition-all text-sm font-medium"
                  >
                    View Profile
                  </a>
                  <button className="bg-gray-700/50 hover:bg-gray-600/50 text-white px-4 py-2 rounded-lg transition-all">
                    💬
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="flex justify-center mt-8">
              <div className="bg-gray-800/50 rounded-lg px-6 py-3">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <span className="text-gray-400">Loading more users...</span>
                </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No users found</h3>
              <p className="text-gray-400">
                {searchQuery 
                  ? `No users match your search for "${searchQuery}". Try different keywords or filters.`
                  : 'Try adjusting your search filters or search for specific users.'
                }
              </p>
            </div>
          )}

          {/* End of Results */}
          {!hasMore && users.length > 0 && (
            <div className="text-center mt-8 py-4">
              <div className="inline-block bg-gray-800/50 rounded-lg px-4 py-2">
                <span className="text-gray-400">🎯 You have reached the end of the results</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
