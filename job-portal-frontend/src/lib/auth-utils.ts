// Token refresh utility
export const refreshAuthToken = async (refreshToken: string) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    
    if (data.success && data.access_token) {
      // Update localStorage
      localStorage.setItem('access_token', data.access_token)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken
      }
    } else {
      throw new Error('Invalid refresh token response')
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    throw error
  }
}

// Enhanced fetch with automatic token refresh
export const fetchWithAuth = async (
  url: string, 
  options: RequestInit = {}, 
  accessToken: string, 
  refreshToken: string,
  onTokenRefresh?: (tokens: { access_token: string; refresh_token: string }) => void
) => {
  // First attempt with current token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  // If 401, try to refresh token and retry
  if (response.status === 401 && refreshToken) {
    try {
      console.log('🔄 Token expired, attempting refresh...')
      const newTokens = await refreshAuthToken(refreshToken)
      
      // Notify parent component of new tokens
      if (onTokenRefresh) {
        onTokenRefresh(newTokens)
      }

      // Retry the original request with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newTokens.access_token}`,
        },
      })

      return retryResponse
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError)
      // If refresh fails, redirect to login
      window.location.href = '/auth'
      throw refreshError
    }
  }

  return response
}
