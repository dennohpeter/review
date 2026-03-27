'use client'

import React, { useEffect, useState, useRef, useContext } from 'react'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/app/components/ui/Card'
import {
  Headphones,
  ArrowRight,
  Mail,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react'
import { AuthContext } from '@/app/context'

export const LoginPage = () => {
  const {
    isLoading,
    loginStep,
    loginEmail,
    loginError,
    initiateLogin,
    verifyCode,
    resetLogin,
  } = useContext(AuthContext)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (loginStep === 'code' && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [loginStep])

  const handleEmailSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (email) initiateLogin(email)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) inputRefs.current[index + 1]?.focus()

    if (index === 5 && value) {
      const fullCode = newCode.join('')
      if (fullCode.length === 6) verifyCode(fullCode)
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = () => verifyCode(code.join(''))

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="h-12 w-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-zinc-200">
          <Headphones className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          AudioScribe
        </h1>
      </div>

      <Card className="w-full max-w-sm shadow-xl shadow-zinc-200/50 border-zinc-100">
        {loginStep === 'email' ? (
          <form onSubmit={handleEmailSubmit}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center">Sign in</CardTitle>
              <p className="text-sm text-zinc-500 text-center">
                Enter your email to receive a passcode
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="relative">
                <Mail className="h-4 w-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {loginError}
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Send Passcode
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        ) : (
          <div>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center">
                Check your email
              </CardTitle>
              <p className="text-sm text-zinc-500 text-center">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-zinc-900">{loginEmail}</span>
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex justify-center gap-2">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-10 h-12 text-center text-xl font-bold border border-zinc-200 rounded-md focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all"
                  />
                ))}
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md justify-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {loginError}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                onClick={handleVerify}
                className="w-full"
                isLoading={isLoading}
                disabled={code.some((d) => !d)}
              >
                Verify & Sign In
              </Button>

              <button
                onClick={resetLogin}
                className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Use a different email
              </button>
            </CardFooter>
          </div>
        )}
      </Card>

      <div className="mt-8 text-center text-sm text-zinc-400">
        <p>Protected by AudioScribe Secure Auth</p>
      </div>
    </div>
  )
}
