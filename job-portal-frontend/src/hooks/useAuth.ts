import { useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  user_type: 'admin' | 'company' | 'jobseeker';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  company_name?: string;
  company_description?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  logo_url?: string;
  is_approved?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from localStorage on component mount
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (storedToken && userData) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (userToken: string, userData: User) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateUser
  };
}
