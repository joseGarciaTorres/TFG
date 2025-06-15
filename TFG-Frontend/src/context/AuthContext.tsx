import React, { createContext, useContext, useState, useEffect } from 'react'
import axiosInstance from '../utils/axiosInstance'

interface AuthContextType {
  accessToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

interface TokenResponse {
    token: {
      access: string
      refresh: string
    }
  }

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    chrome.storage.local.get(['access'], (result) => {
      if (result.access) setAccessToken(result.access)
    })
  }, [])

  const login = async (email: string, password: string) => {
    const response = await axiosInstance.post<TokenResponse>('/user/login/', { email, password })
    const { access, refresh } = response.data.token
    setAccessToken(access)
    chrome.storage.local.set({ access, refresh })
  }

  const logout = () => {
    setAccessToken(null);
    chrome.storage.local.remove(['access', 'refresh']);
    window.location.reload();
  }

  return (
    <AuthContext.Provider value={{ accessToken, login, logout, isAuthenticated: !!accessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}