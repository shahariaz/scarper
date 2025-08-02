'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function TestUserPage() {
  const params = useParams()
  const userId = params.id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching user:', userId)
        const response = await fetch(`http://localhost:5000/api/users/${userId}/profile`)
        console.log('Response status:', response.status)
        const result = await response.json()
        console.log('Response data:', result)
        
        if (result.success) {
          setData(result.profile)
        } else {
          setError(result.message)
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  if (loading) return <div style={{color: 'white', padding: '20px'}}>Loading user {userId}...</div>
  if (error) return <div style={{color: 'red', padding: '20px'}}>Error: {error}</div>
  if (!data) return <div style={{color: 'yellow', padding: '20px'}}>No data for user {userId}</div>

  return (
    <div style={{color: 'white', padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh'}}>
      <h1>Test User Page - ID: {userId}</h1>
      <h2>Profile Data:</h2>
      <pre style={{color: 'lightgreen', fontSize: '12px'}}>
        {JSON.stringify(data, null, 2)}
      </pre>
      <h2>Raw Data:</h2>
      <div>
        <p>Name: {data.first_name} {data.last_name}</p>
        <p>Email: {data.email}</p>
        <p>Type: {data.user_type}</p>
        <p>ID: {data.id}</p>
      </div>
    </div>
  )
}
