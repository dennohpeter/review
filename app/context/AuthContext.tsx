'use client'

import { createContext } from 'react'
import { User, UserRole } from '@/app/types'

interface AuthContextType {
  user: User | null
  reviewers: User[]
  isAuthenticated: boolean
  isLoading: boolean

  loginStep: 'email' | 'code'
  loginEmail: string
  loginError: string | null

  initiateLogin: (email: string) => Promise<void>
  verifyCode: (code: string) => Promise<void>
  logout: () => void
  resetLogin: () => void

  inviteUser: (email: string, name: string, role: UserRole) => void
  removeUser: (id: string) => void
}

export const defaultValue: AuthContextType = {
  user: null,
  reviewers: [],
  isAuthenticated: false,
  isLoading: false,

  loginStep: 'email',
  loginEmail: '',
  loginError: null,

  initiateLogin: async () => {},
  verifyCode: async () => {},
  logout: () => {},
  resetLogin: () => {},

  inviteUser: () => {},
  removeUser: () => {},
}

export const AuthContext = createContext<AuthContextType>(defaultValue)
