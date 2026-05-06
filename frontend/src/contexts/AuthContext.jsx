import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await api.get('/auth/me')
      setUser(data)
    } catch {
      localStorage.clear()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    setUser(data.user)
    return data.user
  }

  const signup = async (name, email, password, role) => {
    const { data } = await api.post('/auth/signup', { name, email, password, role })
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
