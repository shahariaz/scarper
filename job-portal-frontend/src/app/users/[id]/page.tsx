"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Building, 
  User, 
  Users, 
  UserPlus, 
  UserMinus,
  Calendar,
  Mail,
  Globe,
  Briefcase,
  Star,
  MessageCircle,
  Activity
} from 'lucide-react';
import { RootState } from '@/store/store';

interface UserProfile {
  id: number;
  email: string;
  user_type: 'jobseeker' | 'company' | 'admin';
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url?: string;
  bio: string;
  created_at: string;
  is_following?: boolean;
  followers_count: number;
  following_count: number;
  
  // Company specific
  company_name?: string;
  industry?: string;
  location?: string;
  logo_url?: string;
  website?: string;
  is_approved?: boolean;
  
  // Jobseeker specific
  experience_level?: string;
  current_position?: string;
  skills?: string;
  available_for_work?: boolean;
  
  // Profile specific
  phone?: string;
  social_links?: string;
  portfolio_url?: string;
}

interface ActivityItem {
  id: number;
  activity_type: string;
  title: string;
  description: string;
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const dispatch = useDispatch();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { user: currentUser, isAuthenticated, tokens } = useSelector((state: RootState) => state.auth);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/public-profile`);
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.user);
        setFollowing(data.user.is_following || false);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/activity-feed`);
      const data = await response.json();
      
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !tokens?.access_token) return;
    
    setFollowLoading(true);
    try {
      const endpoint = following ? 'unfollow' : 'follow';
      const response = await fetch(`http://localhost:5000/api/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setFollowing(!following);
        // Update followers count
        if (profile) {
          setProfile({
            ...profile,
            followers_count: following ? profile.followers_count - 1 : profile.followers_count + 1
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchActivities();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="flex items-start space-x-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h2>
              <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Building className="h-5 w-5" />;
      case 'jobseeker':
        return <User className="h-5 w-5" />;
      case 'admin':
        return <Users className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'company':
        return 'bg-blue-100 text-blue-800';
      case 'jobseeker':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOwnProfile = currentUser && currentUser.id === profile.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url || profile.logo_url} />
                  <AvatarFallback className="text-2xl">
                    {profile.user_type === 'company' 
                      ? (profile.company_name?.[0] || profile.email[0]).toUpperCase()
                      : `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || profile.email[0].toUpperCase()
                    }
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.user_type === 'company' ? profile.company_name : profile.display_name}
                    </h1>
                    <Badge className={getUserTypeColor(profile.user_type)}>
                      {getUserTypeIcon(profile.user_type)}
                      <span className="ml-1 capitalize">{profile.user_type}</span>
                    </Badge>
                  </div>
                  
                  {profile.current_position && (
                    <p className="text-lg text-gray-600 mb-2">{profile.current_position}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    {profile.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {profile.location}
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {profile.email}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {profile.bio && (
                    <p className="text-gray-700 mb-4">{profile.bio}</p>
                  )}
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="font-semibold">{profile.followers_count}</span> followers
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span className="font-semibold">{profile.following_count}</span> following
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2">
                {!isOwnProfile && isAuthenticated && (
                  <>
                    <Button
                      variant={following ? "outline" : "default"}
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className="flex items-center"
                    >
                      {following ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.user_type === 'company' && (
                  <>
                    {profile.industry && (
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">Industry:</span>
                        <span className="ml-2">{profile.industry}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">Website:</span>
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </>
                )}
                
                {profile.user_type === 'jobseeker' && (
                  <>
                    {profile.experience_level && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">Experience Level:</span>
                        <span className="ml-2 capitalize">{profile.experience_level}</span>
                      </div>
                    )}
                    {profile.skills && (
                      <div>
                        <span className="font-medium">Skills:</span>
                        <p className="mt-1 text-gray-700">{profile.skills}</p>
                      </div>
                    )}
                    {profile.available_for_work !== undefined && (
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">Available for Work:</span>
                        <Badge className={profile.available_for_work ? 'bg-green-100 text-green-800 ml-2' : 'bg-red-100 text-red-800 ml-2'}>
                          {profile.available_for_work ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-blue-500" />
                      <div>
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activity</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardContent className="p-8 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Posts feature coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
