'use client'
// src/lib/auth-context.tsx
// Client-side session state — shared across header, admin layout, forms

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type UserRole = 'CITIZEN' | 'MCA' | 'COUNTY_ADMIN' | 'GOVERNOR_EXEC'

export interface AuthUser {
  userId:         string
  role:           UserRole
  fullName:       string
  phoneNumber:    string
  assignedWardId: number | null
}

interface AuthContextValue {
  user:     AuthUser | null
  loading:  boolean
  refresh:  () => Promise<void>
  logout:   () => Promise<void>
  isAdmin:  boolean
  isMca:    boolean
  isGov:    boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch('/api/auth/session', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setUser(data.data)
      else              setUser(null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' })
    setUser(null)
    window.location.href = '/'
  }

  const isAdmin = user?.role === 'COUNTY_ADMIN' || user?.role === 'GOVERNOR_EXEC'
  const isMca   = user?.role === 'MCA'
  const isGov   = user?.role === 'GOVERNOR_EXEC'

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout, isAdmin, isMca, isGov }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
