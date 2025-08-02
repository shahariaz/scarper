'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { 
  Briefcase, 
  Users, 
  FileText, 
  TrendingUp, 
  Plus,
  Search,
  Filter,
  Bookmark,
  Share2,
  MessageSquare,
  Heart,
  ChevronDown,
  MapPin,
  Calendar,
  Eye,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

// Types for different content types
interface HomePageContent {
  id: string
  type: 'job' | 'blog' | 'user_activity' | 'trending' | 'company_update'
  data: any
  created_at: string
  engagement: {
    likes: number
    comments: number
    shares: number
    views: number
  }
  priority: number
}

// Content categories for filtering
const CONTENT_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'jobs', label: 'Jobs', icon: '💼' },
  { id: 'blogs', label: 'Articles', icon: '📝' },
  { id: 'people', label: 'People', icon: '👥' },
  { id: 'companies', label: 'Companies', icon: '🏢' },
]

// Quick actions for authenticated users
const QUICK_ACTIONS = [
  { id: 'post-job', label: 'Post Job', icon: Briefcase, href: '/post-job', color: 'blue' },
  { id: 'write-blog', label: 'Write Article', icon: FileText, href: '/blogs/create', color: 'green' },
  { id: 'find-people', label: 'Find People', icon: Users, href: '/users/search', color: 'purple' },
  { id: 'market-insights', label: 'Market Insights', icon: TrendingUp, href: '/jobs', color: 'orange' },
]

export default function HomePage() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [activeCategory, setActiveCategory] = useState('all')
  const [personalizedFeed, setPersonalizedFeed] = useState(true)

  // Fetch unified content feed with infinite scroll
  const {
    data: contentPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: ['homeFeed', activeCategory],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        per_page: '15',
        category: activeCategory
      })
      
      // For testing, always use user_id=1 to see personalized feed
      params.append('user_id', '1')
      
      console.log('Fetching feed with params:', params.toString())
      
      const response = await fetch(`http://localhost:5000/api/home/feed?${params}`)
      if (!response.ok) {
        console.error('Feed API Error:', response.status, await response.text())
        throw new Error('Failed to fetch content')
      }
      const data = await response.json()
      console.log('Feed response:', data)
      return data
    },
    getNextPageParam: (lastPage: any) => 
      lastPage.pagination.has_next ? lastPage.pagination.page + 1 : undefined,
    refetchInterval: 60000, // Refetch every minute for real-time updates
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data stale after 30 seconds
  })

  // Flatten all content from pages
  const allContent = useMemo(() => 
    contentPages?.pages.flatMap(page => page.content) || [], 
    [contentPages]
  )

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop
      >= document.documentElement.offsetHeight - 1000 && // Load when 1000px from bottom
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Render different content types
  const renderContentCard = (content: HomePageContent) => {
    switch (content.type) {
      case 'job':
        return <JobCard key={content.id} job={content.data} engagement={content.engagement} />
      case 'blog':
        return <BlogCard key={content.id} blog={content.data} engagement={content.engagement} />
      case 'user_activity':
        return <ActivityCard key={content.id} activity={content.data} />
      default:
        return null
    }
  }

  if (isLoading && !allContent.length) {
    return <HomePageSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Your Career Journey Starts Here
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
                Discover jobs, connect with professionals, share insights, and grow your career
                in Bangladesh&apos;s thriving tech ecosystem
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/jobs">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4 text-lg">
                    Explore Jobs
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 text-lg">
                  Join Community
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Quick Actions & Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Quick Actions for Authenticated Users */}
              {isAuthenticated && (
                <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {QUICK_ACTIONS.map((action) => (
                      <Link key={action.id} href={action.href}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-auto p-3 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
                        >
                          <action.icon className="w-5 h-5 text-blue-600" />
                          <span className="text-xs font-medium text-gray-700">{action.label}</span>
                        </Button>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              {/* Content Categories */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  Categories
                </h3>
                <div className="space-y-2">
                  {CONTENT_CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                        activeCategory === category.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="text-sm">{category.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Platform Stats */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Platform Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Jobs</span>
                    <span className="font-bold text-blue-600">2,847</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">New This Week</span>
                    <span className="font-bold text-green-600">+156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Companies Hiring</span>
                    <span className="font-bold text-purple-600">423</span>
                  </div>
                </div>
              </Card>
            </div>
          </aside>

          {/* Main Content Feed */}
          <main className="lg:col-span-2">
            <div className="space-y-6">
              {/* Feed Header */}
              <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {activeCategory === 'all' ? 'Your Feed' : 
                     CONTENT_CATEGORIES.find(c => c.id === activeCategory)?.label || 'Feed'}
                  </h2>
                  {isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPersonalizedFeed(!personalizedFeed)}
                      className={personalizedFeed ? 'text-blue-600' : 'text-gray-500'}
                    >
                      {personalizedFeed ? '✨ Personalized' : '🌐 Explore'}
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Content Feed */}
              <div className="space-y-6">
                {allContent.map(renderContentCard)}
                
                {/* Load More Button */}
                {hasNextPage && (
                  <div className="text-center">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      size="lg"
                      className="px-8"
                    >
                      {isFetchingNextPage ? 'Loading...' : 'Load More'}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </main>

          {/* Right Sidebar - Recommendations & Featured */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Featured Companies */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Featured Companies</h3>
                <div className="space-y-3">
                  {['TechCorp Solutions', 'InnovateIT', 'StartupXYZ'].map((company) => (
                    <div key={company} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        {company.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{company}</p>
                        <p className="text-xs text-gray-500">{Math.floor(Math.random() * 20) + 5} open positions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Trending Topics */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Trending Today</h3>
                <div className="space-y-3">
                  {['React Developer', 'Remote Work', 'Fintech Jobs', 'UI/UX Design', 'Machine Learning'].map((trend) => (
                    <div key={trend} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
                        #{trend}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor(Math.random() * 1000) + 100}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// Component for rendering job cards
function JobCard({ job, engagement }: { job: any; engagement: any }) {
  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
            {job.company?.charAt(0) || 'J'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {job.title}
            </h3>
            <p className="text-gray-600 font-medium">{job.company}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(job.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <Bookmark className="w-4 h-4" />
        </Button>
      </div>
      
      <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {engagement.views}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            {engagement.comments}
          </span>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          Apply Now
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  )
}

// Component for rendering blog cards
function BlogCard({ blog, engagement }: { blog: any; engagement: any }) {
  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {blog.author_name?.charAt(0) || 'A'}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{blog.author_name}</p>
          <p className="text-sm text-gray-500">{new Date(blog.created_at).toLocaleDateString()}</p>
        </div>
      </div>
      
      <h3 className="font-bold text-xl text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
        {blog.title}
      </h3>
      
      <p className="text-gray-700 mb-4 line-clamp-3">{blog.excerpt || blog.content}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
            <Heart className="w-4 h-4" />
            {engagement.likes}
          </button>
          <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
            <MessageSquare className="w-4 h-4" />
            {engagement.comments}
          </button>
          <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
            <Share2 className="w-4 h-4" />
            {engagement.shares}
          </button>
        </div>
        <Link href={`/blogs/${blog.slug || blog.id}`}>
          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
            Read More
          </Button>
        </Link>
      </div>
    </Card>
  )
}

// Component for user activity cards
function ActivityCard({ activity }: { activity: any }) {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
          {activity.user_name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-900">
            <span className="font-medium">{activity.user_name}</span> {activity.description}
          </p>
          <p className="text-xs text-gray-500 mt-1">{new Date(activity.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </Card>
  )
}

// Loading skeleton
function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Skeleton key={j} className="h-10 w-full" />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </aside>
          
          <main className="lg:col-span-2">
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-32 w-full" />
                </Card>
              ))}
            </div>
          </main>
          
          <aside className="lg:col-span-1">
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <Skeleton key={j} className="h-16 w-full" />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
