'use client'

import { supabase } from '@/app/lib/supabase/browser'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseIdleLogoutOptions {
  timeoutMs?: number
  warningMs?: number
  enabled?: boolean
}

const LAST_ACTIVITY_KEY = 'lastActivity'
const APP_LOGOUT_KEY = 'app_logout'

export function useIdleLogout({
  timeoutMs = 15 * 60 * 1000,
  warningMs = 2 * 60 * 1000,
  enabled = true,
}: UseIdleLogoutOptions = {}) {
  const router = useRouter()

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )

  const [isWarningOpen, setIsWarningOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(warningMs / 1000))

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const doLogout = useCallback(async () => {
    clearTimers()
    setIsWarningOpen(false)

    try {
      await supabase.auth.signOut()
    } finally {
      localStorage.removeItem(LAST_ACTIVITY_KEY)
      localStorage.setItem(APP_LOGOUT_KEY, Date.now().toString())
      router.replace('/login')
    }
  }, [clearTimers, router])

  const startTimers = useCallback(() => {
    if (!enabled) return

    clearTimers()
    setIsWarningOpen(false)
    setSecondsLeft(Math.floor(warningMs / 1000))

    const now = Date.now()
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString())

    const warningDelay = Math.max(timeoutMs - warningMs, 0)

    warningTimerRef.current = setTimeout(() => {
      setIsWarningOpen(true)
    }, warningDelay)

    logoutTimerRef.current = setTimeout(() => {
      void doLogout()
    }, timeoutMs)
  }, [clearTimers, doLogout, enabled, timeoutMs, warningMs])

  const staySignedIn = useCallback(() => {
    startTimers()
  }, [startTimers])

  useEffect(() => {
    if (!enabled) {
      clearTimers()
      setIsWarningOpen(false)
      return
    }

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ]

    const handleActivity = () => {
      startTimers()
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === APP_LOGOUT_KEY) {
        clearTimers()
        setIsWarningOpen(false)
        router.replace('/login')
      }
    }

    // Fresh authenticated session start:
    // clear stale logout markers and reset activity timestamp.
    localStorage.removeItem(APP_LOGOUT_KEY)
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())

    events.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    )
    window.addEventListener('storage', handleStorage)

    startTimers()

    return () => {
      clearTimers()
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      )
      window.removeEventListener('storage', handleStorage)
    }
  }, [enabled, clearTimers, router, startTimers])

  useEffect(() => {
    if (!enabled || !isWarningOpen) return

    setSecondsLeft(Math.floor(warningMs / 1000))

    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
        countdownIntervalRef.current = null
      }
    }
  }, [enabled, isWarningOpen, warningMs])

  return {
    isWarningOpen,
    secondsLeft,
    staySignedIn,
    logoutNow: doLogout,
  }
}
