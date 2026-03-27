import { User, UserRole } from '@/app/types'
import { SupabaseClient } from '@supabase/supabase-js'

type UseAuthParams = {
  supabase: SupabaseClient
  loginEmail: string
  setUser: (user: User | null) => void
  setIsLoading: (isLoading: boolean) => void
  setLoginError: (error: string | null) => void
  setLoginStep: (step: 'email' | 'code') => void
  setLoginEmail: (email: string) => void
}

export const useAuth = ({
  supabase,
  loginEmail,
  setUser,
  setIsLoading,
  setLoginError,
  setLoginStep,
  setLoginEmail,
}: UseAuthParams) => {
  const initiateLogin = async (email: string) => {
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
  }

  const verifyCode = async (code: string) => {
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
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    resetLogin()
  }

  const resetLogin = () => {
    setLoginStep('email')
    setLoginEmail('')
    setLoginError(null)
  }

  const inviteUser = (email: string, name: string, role: UserRole) => {
    console.warn({ email, name, role })
    throw new Error('Invite user must be implemented via a secure server API.')
  }

  const removeUser = (id: string) => {
    console.warn({ id })
    throw new Error('Remove user must be implemented via a secure server API.')
  }

  return {
    initiateLogin,
    verifyCode,
    logout,
    resetLogin,
    inviteUser,
    removeUser,
  }
}
