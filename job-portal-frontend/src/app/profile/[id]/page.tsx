'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchUserProfile,
  followUser,
  unfollowUser,
  checkFollowStatus,
  fetchFollowers,
  fetchFollowing,
  selectUserProfile,
  selectFollowStatus,
  selectFollowers,
  selectFollowing,
  selectSocialLoading,
} from '@/store/slices/socialSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageViewer from '@/components/ui/image-viewer';
import {
  UserPlus,
  UserMinus,
  MapPin,
  Globe,
  Calendar,
  Briefcase,
  ThumbsUp,
  BookOpen,
  Eye,
} from 'lucide-react';

export default function UserProfile() {
  const dispatch = useDispatch<AppDispatch>();
  const params = useParams();
  const userId = parseInt(params.id as string);
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => selectUserProfile(state, userId));
  const isFollowing = useSelector((state: RootState) => selectFollowStatus(state, userId));
  const followers = useSelector((state: RootState) => selectFollowers(state, userId));
  const following = useSelector((state: RootState) => selectFollowing(state, userId));
  const loading = useSelector(selectSocialLoading);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserProfile(userId));
      if (currentUser) {
        dispatch(checkFollowStatus(userId));
      }
    }
  }, [dispatch, userId, currentUser]);

  const handleFollow = async () => {
    if (!currentUser) return;
    
    try {
      if (isFollowing) {
        await dispatch(unfollowUser(userId)).unwrap();
      } else {
        await dispatch(followUser(userId)).unwrap();
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  const loadFollowers = () => {
    dispatch(fetchFollowers({ userId }));
    setShowFollowersModal(true);
  };

  const loadFollowing = () => {
    dispatch(fetchFollowing({ userId }));
    setShowFollowingModal(true);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-96 bg-gray-800 rounded"></div>
              <div className="md:col-span-2 h-96 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentUser = currentUser?.id === userId;
  const displayName = profile.first_name && profile.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile.email;
  
  const avatarFallback = profile.first_name && profile.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : profile.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Cover Photo Section */}
      <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-700 overflow-hidden group"
           style={profile.cover_url ? { 
             backgroundImage: `url(${profile.cover_url})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center'
           } : {}}>
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Cover Image Viewer - only show if cover image exists */}
        {profile.cover_url && (
          <ImageViewer
            src={profile.cover_url}
            alt={`${displayName}'s Cover Photo`}
            title={`${displayName}'s Cover Photo`}
            trigger={
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-pointer">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 hover:bg-white/30 transition-colors">
                  <div className="flex items-center gap-2 text-white">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">View Cover Photo</span>
                  </div>
                </div>
              </div>
            }
          />
        )}
      </div>

      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative group">
              <Avatar className="w-32 h-32 ring-4 ring-gray-800 shadow-lg cursor-pointer">
                <AvatarImage src={profile.avatar_url} alt={displayName} />
                <AvatarFallback className="text-2xl bg-blue-600 text-white">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              
              {/* Profile Image Viewer - only show if avatar exists */}
              {profile.avatar_url && (
                <ImageViewer
                  src={profile.avatar_url}
                  alt={`${displayName}'s Profile Picture`}
                  title={`${displayName}'s Profile Picture`}
                  trigger={
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
                      <div className="bg-white/90 text-gray-800 rounded-lg px-3 py-1.5 hover:bg-white transition-colors shadow-lg">
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3 w-3" />
                          <span className="text-xs font-medium">View</span>
                        </div>
                      </div>
                    </div>
                  }
                />
              )}
            </div>
            
            <div className="flex-1 pt-16">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{displayName}</h1>
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Badge variant="secondary" className="capitalize">
                      {profile.user_type}
                    </Badge>
                    {profile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                  </div>
                  {profile.current_position && (
                    <div className="flex items-center gap-2 text-gray-300 mb-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{profile.current_position}</span>
                    </div>
                  )}
                </div>
                
                {!isCurrentUser && currentUser && (
                  <Button
                    className={`px-6 ${
                      isFollowing 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleFollow}
                    disabled={loading.follow}
                  >
                    {loading.follow ? (
                      'Loading...'
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-gray-300 mb-4 max-w-2xl">{profile.bio}</p>
              )}
              
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
                {profile.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 px-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {profile.social_stats.followers_count}
              </div>
              <div className="text-sm text-gray-400 cursor-pointer" onClick={loadFollowers}>
                Followers
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {profile.social_stats.following_count}
              </div>
              <div className="text-sm text-gray-400 cursor-pointer" onClick={loadFollowing}>
                Following
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {profile.social_stats.blogs_count}
              </div>
              <div className="text-sm text-gray-400 flex items-center justify-center gap-1">
                <BookOpen className="w-4 h-4" />
                Blogs
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {profile.social_stats.total_likes_received}
              </div>
              <div className="text-sm text-gray-400 flex items-center justify-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                Likes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <div className="px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
              Overview
            </TabsTrigger>
            <TabsTrigger value="blogs" className="data-[state=active]:bg-blue-600">
              Blogs
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600">
              Activity
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-blue-600">
              About
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-400 text-center py-8">
                    Activity feed coming soon...
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Blogs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-400 text-center py-8">
                    Recent blogs coming soon...
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="blogs" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">All Blogs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-400 text-center py-8">
                  Blog listing coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-400 text-center py-8">
                  Activity timeline coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="about" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.user_type === 'company' && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.company_name && (
                      <div>
                        <label className="text-sm text-gray-400">Company Name</label>
                        <p className="text-white">{profile.company_name}</p>
                      </div>
                    )}
                    {profile.industry && (
                      <div>
                        <label className="text-sm text-gray-400">Industry</label>
                        <p className="text-white">{profile.industry}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {profile.user_type === 'jobseeker' && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.experience_level && (
                      <div>
                        <label className="text-sm text-gray-400">Experience Level</label>
                        <p className="text-white capitalize">{profile.experience_level}</p>
                      </div>
                    )}
                    {profile.available_for_work !== undefined && (
                      <div>
                        <label className="text-sm text-gray-400">Available for Work</label>
                        <p className="text-white">
                          {profile.available_for_work ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Email</label>
                    <p className="text-white">{profile.email}</p>
                  </div>
                  {profile.location && (
                    <div>
                      <label className="text-sm text-gray-400">Location</label>
                      <p className="text-white">{profile.location}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Followers</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFollowersModal(false)}
                className="text-gray-400"
              >
                ×
              </Button>
            </div>
            <div className="space-y-3">
              {followers.data.map((follower) => (
                <div key={follower.id} className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={follower.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {follower.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Link 
                      href={`/profile/${follower.id}`}
                      className="text-white hover:text-blue-400"
                    >
                      {follower.first_name && follower.last_name
                        ? `${follower.first_name} ${follower.last_name}`
                        : follower.email}
                    </Link>
                    <p className="text-sm text-gray-400 capitalize">{follower.user_type}</p>
                  </div>
                </div>
              ))}
              {followers.data.length === 0 && (
                <p className="text-gray-400 text-center py-4">No followers yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Following</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFollowingModal(false)}
                className="text-gray-400"
              >
                ×
              </Button>
            </div>
            <div className="space-y-3">
              {following.data.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Link 
                      href={`/profile/${user.id}`}
                      className="text-white hover:text-blue-400"
                    >
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.email}
                    </Link>
                    <p className="text-sm text-gray-400 capitalize">{user.user_type}</p>
                  </div>
                </div>
              ))}
              {following.data.length === 0 && (
                <p className="text-gray-400 text-center py-4">Not following anyone yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
