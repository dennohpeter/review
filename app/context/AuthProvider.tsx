'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { User, UserRole } from '../types'
import { AuthContext } from './AuthContext'
import { createSupabaseBrowserClient } from '../lib/supabase/browser'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const [loginStep, setLoginStep] = useState<'email' | 'code'>('email')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const sessionUser = session?.user ?? null

        if (!sessionUser) {
          setUser(null)
          return
        }

        setUser({
          id: sessionUser.id,
          name:
            (sessionUser.user_metadata?.name as string | undefined) ??
            sessionUser.email ??
            'User',
          email: sessionUser.email ?? '',
          role:
            (sessionUser.user_metadata?.role as UserRole | undefined) ??
            'reviewer',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.id}`,
        })
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const {
    initiateLogin,
    verifyCode,
    logout,
    resetLogin,
    inviteUser,
    removeUser,
  } = useAuth({
    supabase,
    setUser,
    setIsLoading,
    setLoginError,
    setLoginStep,
    setLoginEmail,
    loginEmail,
  })

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginStep,
        loginEmail,
        loginError,
        initiateLogin,
        verifyCode,
        logout,
        resetLogin,
        inviteUser,
        removeUser,
        reviewers: [], // This should be fetched from your database in a real implementation
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
