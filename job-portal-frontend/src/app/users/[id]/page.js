'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id
  
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [userBlogs, setUserBlogs] = useState([])
  const [blogsLoading, setBlogsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Theme helper function
  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'company':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'jobseeker':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'admin':
        return 'bg-purple-100 text-purple-800 border border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching profile for user ID:', userId)
      const response = await fetch(`http://localhost:5000/api/users/${userId}/profile`)
      console.log('Profile API response status:', response.status)
      const data = await response.json()
      console.log('Profile API response data:', data)
      
      if (data.success) {
        setProfile(data.profile)
        setError(null)
      } else {
        setError(data.message || 'Failed to load profile')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const checkFollowStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`http://localhost:5000/api/users/${userId}/is-following`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setIsFollowing(data.is_following)
      }
    } catch (err) {
      console.error('Error checking follow status:', err)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchUserProfile()
      checkFollowStatus()
    }
  }, [userId, fetchUserProfile, checkFollowStatus])

  const handleFollowToggle = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please login to follow users')
        return
      }

      setFollowLoading(true)
      const endpoint = isFollowing ? 'unfollow' : 'follow'
      const response = await fetch(`http://localhost:5000/api/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsFollowing(!isFollowing)
        // Update follower count in profile
        if (profile) {
          setProfile({
            ...profile,
            social_stats: {
              ...profile.social_stats,
              followers_count: profile.social_stats.followers_count + (isFollowing ? -1 : 1)
            }
          })
        }
      } else {
        alert(data.message || 'Failed to update follow status')
      }
    } catch (err) {
      console.error('Error toggling follow:', err)
      alert('Failed to update follow status')
    } finally {
      setFollowLoading(false)
    }
  }

  const fetchFollowers = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/followers`)
      const data = await response.json()
      
      if (data.success) {
        setFollowers(data.followers)
      }
    } catch (err) {
      console.error('Error fetching followers:', err)
    }
  }, [userId])

  const fetchFollowing = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/following`)
      const data = await response.json()
      
      if (data.success) {
        setFollowing(data.following)
      }
    } catch (err) {
      console.error('Error fetching following:', err)
    }
  }, [userId])

  const fetchUserBlogs = useCallback(async () => {
    try {
      setBlogsLoading(true)
      const response = await fetch(`http://localhost:5000/api/users/${userId}/blogs?page=1&per_page=10`)
      const data = await response.json()
      
      if (data.success) {
        setUserBlogs(data.blogs || [])
      } else {
        console.error('Failed to fetch user blogs:', data.message)
        setUserBlogs([])
      }
    } catch (err) {
      console.error('Error fetching user blogs:', err)
      setUserBlogs([])
    } finally {
      setBlogsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (activeTab === 'followers') {
      fetchFollowers()
    } else if (activeTab === 'following') {
      fetchFollowing()
    } else if (activeTab === 'posts') {
      fetchUserBlogs()
    }
  }, [activeTab, fetchFollowers, fetchFollowing, fetchUserBlogs])

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              <span className="ml-3 text-gray-400">Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">Error Loading Profile</h3>
              <p className="text-gray-400">{error}</p>
              <button 
                onClick={fetchUserProfile}
                className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show "not found" only if we're done loading and have no profile data
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">User Not Found</h3>
              <p className="text-gray-400">The requested user profile could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get theme colors based on user type
  const getTheme = (userType) => {
    switch (userType) {
      case 'company':
        return {
          gradient: 'from-blue-600 via-indigo-600 to-purple-600',
          bg: 'from-blue-50 to-indigo-50',
          accent: 'blue-600',
          light: 'blue-50',
          ring: 'blue-500',
          text: 'blue-700',
          badge: 'bg-blue-100 text-blue-800',
          icon: '🏢',
          title: 'Company Profile'
        }
      case 'jobseeker':
        return {
          gradient: 'from-green-600 via-emerald-600 to-teal-600',
          bg: 'from-green-50 to-emerald-50',
          accent: 'green-600',
          light: 'green-50',
          ring: 'green-500',
          text: 'green-700',
          badge: 'bg-green-100 text-green-800',
          icon: '👤',
          title: 'Professional Profile'
        }
      case 'admin':
        return {
          gradient: 'from-purple-600 via-pink-600 to-red-600',
          bg: 'from-purple-50 to-pink-50',
          accent: 'purple-600',
          light: 'purple-50',
          ring: 'purple-500',
          text: 'purple-700',
          badge: 'bg-purple-100 text-purple-800',
          icon: '⚡',
          title: 'Administrator Profile'
        }
      default:
        return {
          gradient: 'from-gray-600 via-slate-600 to-gray-600',
          bg: 'from-gray-50 to-slate-50',
          accent: 'gray-600',
          light: 'gray-50',
          ring: 'gray-500',
          text: 'gray-700',
          badge: 'bg-gray-100 text-gray-800',
          icon: '👤',
          title: 'User Profile'
        }
    }
  }

  const theme = profile ? getTheme(profile.user_type) : getTheme('default')

  const displayName = profile.user_type === 'company' 
    ? profile.company_name 
    : `${profile.first_name} ${profile.last_name}`.trim() || profile.email

  const initials = profile.user_type === 'company'
    ? (profile.company_name?.[0] || profile.email[0]).toUpperCase()
    : (profile.first_name?.[0] || '') + (profile.last_name?.[0] || '') || profile.email[0].toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section with Professional Cover */}
      <div className="relative">
        {/* Dynamic Cover Based on User Type */}
        <div className={`h-56 md:h-72 bg-gradient-to-r ${theme.gradient} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Professional Pattern Overlay */}
          <div className="absolute inset-0 opacity-5">
            {profile?.user_type === 'company' && (
              <div className="absolute inset-0">
                <div className="absolute top-8 left-8 w-24 h-24 border-2 border-white rounded-lg"></div>
                <div className="absolute top-16 right-16 w-20 h-20 border border-white rounded-full"></div>
                <div className="absolute bottom-12 left-1/3 w-16 h-16 border-2 border-white rounded-lg rotate-45"></div>
                <div className="absolute bottom-8 right-8 w-12 h-12 border border-white rounded-full"></div>
              </div>
            )}
            {profile?.user_type === 'jobseeker' && (
              <div className="absolute inset-0">
                <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
                <div className="absolute top-20 right-20 w-16 h-16 border border-white rounded-full"></div>
                <div className="absolute bottom-16 left-1/4 w-14 h-14 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-8 right-1/3 w-10 h-10 border border-white rounded-full"></div>
              </div>
            )}
          </div>
          
          {/* Professional Badge */}
          <div className="absolute top-6 right-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center gap-2 text-white">
                <span className="text-lg">{theme.icon}</span>
                <span className="font-semibold text-sm">{theme.title}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Profile Info Overlay */}
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <div className="relative -mt-24 md:-mt-32">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-xl flex items-center justify-center text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">
                        {initials}
                      </div>
                    </div>
                    {/* Online Status Indicator */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Profile Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                            {displayName}
                          </h1>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getUserTypeColor(profile.user_type)}`}>
                            {profile.user_type === 'company' && '🏢'}
                            {profile.user_type === 'jobseeker' && '👤'}
                            {profile.user_type === 'admin' && '⚡'}
                            <span className="ml-1 capitalize">{profile.user_type}</span>
                          </div>
                        </div>
                        
                        {profile.current_position && (
                          <p className="text-lg text-gray-600 mb-3 font-medium">{profile.current_position}</p>
                        )}
                        
                        {profile.bio && (
                          <p className="text-gray-700 mb-4 leading-relaxed">{profile.bio}</p>
                        )}
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                          {profile.location && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {profile.location}
                            </div>
                          )}
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          {profile.website && (
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Website
                            </a>
                          )}
                        </div>
                        
                        {/* Social Stats */}
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{profile.social_stats?.followers_count || 0}</div>
                            <div className="text-sm text-gray-500">Followers</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{profile.social_stats?.following_count || 0}</div>
                            <div className="text-sm text-gray-500">Following</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{profile.social_stats?.blogs_count || 0}</div>
                            <div className="text-sm text-gray-500">Posts</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center min-w-[120px] ${
                            isFollowing
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                          } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {followLoading ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : isFollowing ? (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Following
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Follow
                            </>
                          )}
                        </button>
                        <button className="px-6 py-3 rounded-xl font-semibold bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center min-w-[120px] shadow-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
            <div className="flex border-b border-gray-200">
              {[
                { key: 'overview', label: 'Overview', icon: '👤' },
                { key: 'followers', label: 'Followers', icon: '👥' },
                { key: 'following', label: 'Following', icon: '➡️' },
                { key: 'activity', label: 'Activity', icon: '⚡' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 px-6 py-4 font-medium transition-all duration-200 relative ${
                    activeTab === tab.key
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="p-6 md:p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {profile.user_type === 'company' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="text-2xl mr-3">🏢</span>
                        Company Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile.industry && (
                          <div className="flex items-start">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-1">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v6.5m0 0v6.5m0-6.5a6.5 6.5 0 11-13 0m13 0a6.5 6.5 0 10-13 0" />
                              </svg>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 block mb-1">Industry</label>
                              <p className="text-gray-900 font-medium">{profile.industry}</p>
                            </div>
                          </div>
                        )}
                        {profile.website && (
                          <div className="flex items-start">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-1">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                              </svg>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 block mb-1">Website</label>
                              <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:text-blue-700 transition-colors font-medium">
                                {profile.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {profile.user_type === 'jobseeker' && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="text-2xl mr-3">👤</span>
                        Professional Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile.experience_level && (
                          <div className="flex items-start">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 mt-1">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 block mb-1">Experience Level</label>
                              <p className="text-gray-900 font-medium capitalize">{profile.experience_level}</p>
                            </div>
                          </div>
                        )}
                        {profile.available_for_work !== undefined && (
                          <div className="flex items-start">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 mt-1 ${
                              profile.available_for_work ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <div className={`w-3 h-3 rounded-full ${
                                profile.available_for_work ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 block mb-1">Availability</label>
                              <p className={`font-medium ${profile.available_for_work ? 'text-green-600' : 'text-gray-600'}`}>
                                {profile.available_for_work ? '✅ Available for Work' : '❌ Not Available'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <span className="text-2xl mr-3">📅</span>
                      Member Since
                    </h3>
                    <p className="text-gray-700 text-lg">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'followers' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    Followers ({profile.social_stats?.followers_count || 0})
                  </h3>
                  {followers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {followers.map((follower) => (
                        <div key={follower.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {follower.display_name?.[0] || follower.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{follower.display_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{follower.user_type}</p>
                          </div>
                          <a href={`/users/${follower.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                            View →
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">👥</span>
                      </div>
                      <p className="text-gray-500">No followers yet.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'following' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="text-2xl mr-3">➡️</span>
                    Following ({profile.social_stats?.following_count || 0})
                  </h3>
                  {following.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {following.map((user) => (
                        <div key={user.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.display_name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{user.display_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{user.user_type}</p>
                          </div>
                          <a href={`/users/${user.id}`} className="text-green-600 hover:text-green-700 font-medium">
                            View →
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">➡️</span>
                      </div>
                      <p className="text-gray-500">Not following anyone yet.</p>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'activity' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="text-2xl mr-3">⚡</span>
                    Recent Activity
                  </h3>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <p className="text-gray-500">Activity feed coming soon...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
