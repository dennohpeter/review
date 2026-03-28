'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { User, UserRole } from '../types'
import { AuthContext, AuthContextType } from './AuthContext'
import { createSupabaseBrowserClient } from '../lib/supabase/browser'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [loginStep, setLoginStep] = useState<'email' | 'code'>('email')
  const [loginEmail, setLoginEmail] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)

  const resetLogin = useCallback(() => {
    setLoginStep('email')
    setLoginEmail('')
    setLoginError(null)
  }, [])

  const initiateLogin = useCallback(
    async (email: string) => {
      setIsLoading(true)
      setLoginError(null)

      const cleanEmail = email.trim().toLowerCase()

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          // INVITE-ONLY: prevents creating new users
          shouldCreateUser: false,
        },
      })

      if (error) {
        setLoginError(
          error.message ||
            'No account found with this email. Please contact an admin for an invite.'
        )
        setIsLoading(false)
        return
      }

      setLoginEmail(cleanEmail)
      setLoginStep('code')
      setIsLoading(false)
    },
    [supabase]
  )

  const verifyCode = useCallback(
    async (code: string) => {
      setIsLoading(true)
      setLoginError(null)

      const token = code.trim()

      const { error } = await supabase.auth.verifyOtp({
        email: loginEmail,
        token,
        type: 'email',
      })

      if (error) {
        setLoginError('Invalid passcode. Please try again.')
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      window.location.href = '/'
    },
    [loginEmail, supabase]
  )
  const logout = useCallback(async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    resetLogin()
    setIsLoading(false)
    window.location.href = '/login'
  }, [resetLogin, supabase])

  const inviteUser = useCallback(
    (email: string, name: string, role: UserRole) => {
      console.warn({ email, name, role })
      throw new Error(
        'Invite user must be implemented via a secure server API.'
      )
    },
    []
  )

  const removeUser = useCallback((id: string) => {
    console.warn({ id })
    throw new Error('Remove user must be implemented via a secure server API.')
  }, [])

  useEffect(() => {
    let mounted = true
    const loadSession = async () => {
      setIsLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (session?.user) {
        const sessionUser = session.user

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', sessionUser.id)
          .single()

        if (!mounted) return

        setUser({
          id: sessionUser.id,
          name:
            (sessionUser.user_metadata?.name as string | undefined) ??
            sessionUser.email ??
            'User',
          email: sessionUser.email ?? '',
          role: (profile?.role as UserRole | undefined) ?? 'reviewer',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.id}`,
        })
      } else {
        setUser(null)
      }

      setIsLoading(false)
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const sessionUser = session.user

          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', sessionUser.id)
            .single()

          setUser({
            id: sessionUser.id,
            name:
              (sessionUser.user_metadata?.name as string | undefined) ??
              sessionUser.email ??
              'User',
            email: sessionUser.email ?? '',
            role: (profile?.role as UserRole | undefined) ?? 'reviewer',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.id}`,
          })
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const reviewers = useMemo(() => {
    if (!user) return []
    // For demo purposes, we treat all users as reviewers. In a real app, you'd fetch this from your database.
    return [user]
  }, [user])

  const value = useMemo<AuthContextType>(
    () => ({
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
      reviewers,
    }),
    [
      user,
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
      reviewers,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
