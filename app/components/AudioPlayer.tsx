'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  RotateCcw,
  RotateCw,
  Gauge,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { cn, formatTime } from '@/app/lib/utils'

interface AudioPlayerProps {
  src?: string
  title?: string
  className?: string
}

export function AudioPlayer({
  src,
  title = 'Audio clip',
  className,
}: AudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const waveSurferRef = useRef<WaveSurfer | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)

  const [volume, setVolume] = useState(1)
  const [speed, setSpeed] = useState(1)

  const speeds = [0.75, 1, 1.25, 1.5]

  useEffect(() => {
    if (!containerRef.current || !src) {
      setIsPlaying(false)
      setIsReady(false)
      setIsLoading(false)
      setCurrentTime(0)
      setDuration(0)
      setProgress(0)
      setError(src ? 'Unable to load audio.' : null)
      return
    }

    let isMounted = true
    let isCleaningUp = false

    setIsLoading(true)
    setIsReady(false)
    setError(null)
    setCurrentTime(0)
    setDuration(0)
    setProgress(0)
    setIsPlaying(false)

    if (waveSurferRef.current) {
      try {
        waveSurferRef.current.destroy()
      } catch {}
      waveSurferRef.current = null
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height: 72,
      waveColor: '#d4d4d8',
      progressColor: '#18181b',
      cursorColor: '#27272a',
      barWidth: 2,
      barGap: 2,
      barRadius: 4,
      normalize: true,
      dragToSeek: true,
      autoScroll: false,
      hideScrollbar: true,
      interact: true,
    })

    waveSurferRef.current = ws

    ws.on('load', () => {
      if (!isMounted || isCleaningUp) return
      setIsLoading(true)
      setError(null)
    })

    ws.on('ready', () => {
      if (!isMounted || isCleaningUp) return
      const d = ws.getDuration()
      setDuration(d)
      setIsReady(true)
      setIsLoading(false)
      setError(null)
      ws.setVolume(volume)
      ws.setPlaybackRate(speed)
    })

    ws.on('play', () => {
      if (!isMounted || isCleaningUp) return
      setIsPlaying(true)
    })

    ws.on('pause', () => {
      if (!isMounted || isCleaningUp) return
      setIsPlaying(false)
    })

    ws.on('timeupdate', (time) => {
      if (!isMounted || isCleaningUp) return
      const d = ws.getDuration() || 0
      setCurrentTime(time)
      setProgress(d > 0 ? (time / d) * 100 : 0)
    })

    ws.on('finish', () => {
      if (!isMounted || isCleaningUp) return
      setIsPlaying(false)
      setCurrentTime(ws.getDuration())
      setProgress(100)
    })

    ws.on('error', (err) => {
      if (!isMounted || isCleaningUp) return

      const message =
        err instanceof Error ? err.message : String(err ?? 'Unknown error')

      if (message.toLowerCase().includes('aborted')) {
        return
      }

      setIsLoading(false)
      setIsReady(false)
      setIsPlaying(false)
      setError('Unable to load audio.')
    })

    Promise.resolve()
      .then(() => ws.load(src))
      .catch((err) => {
        if (!isMounted || isCleaningUp) return

        const message =
          err instanceof Error ? err.message : String(err ?? 'Unknown error')

        if (message.toLowerCase().includes('aborted')) {
          return
        }

        setIsLoading(false)
        setIsReady(false)
        setIsPlaying(false)
        setError('Unable to load audio.')
      })

    return () => {
      isMounted = false
      isCleaningUp = true
      try {
        ws.destroy()
      } catch {}
      if (waveSurferRef.current === ws) {
        waveSurferRef.current = null
      }
    }
  }, [src])

  useEffect(() => {
    waveSurferRef.current?.setVolume(volume)
  }, [volume])

  useEffect(() => {
    waveSurferRef.current?.setPlaybackRate(speed)
  }, [speed])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }

      if (e.code === 'ArrowRight') skip(5)
      if (e.code === 'ArrowLeft') skip(-5)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  const togglePlay = async () => {
    const ws = waveSurferRef.current
    if (!ws || !src || !isReady) return

    try {
      ws.playPause()
    } catch {
      setError('Playback failed.')
      setIsPlaying(false)
    }
  }

  const skip = (seconds: number) => {
    const ws = waveSurferRef.current
    if (!ws || !isReady) return

    const d = ws.getDuration() || 0
    const next = Math.max(0, Math.min(d, ws.getCurrentTime() + seconds))
    ws.setTime(next)
  }

  const seek = (value: number) => {
    const ws = waveSurferRef.current
    if (!ws || !duration || !isReady) return

    const nextTime = (value / 100) * duration
    ws.setTime(nextTime)
  }

  const toggleMute = () => {
    setVolume((prev) => (prev === 0 ? 1 : 0))
  }

  const volumeIcon = useMemo(() => {
    return volume === 0 ? (
      <VolumeX className="h-4 w-4" />
    ) : (
      <Volume2 className="h-4 w-4" />
    )
  }, [volume])

  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-200 bg-white shadow-sm',
        className
      )}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-zinc-900 truncate">{title}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {error
                ? 'Audio unavailable'
                : isLoading
                  ? 'Loading waveform...'
                  : isReady
                    ? 'Waveform ready'
                    : 'Preparing player...'}
            </p>
          </div>

          <div className="shrink-0 text-xs font-mono text-zinc-500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
          <div ref={containerRef} className="w-full" />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => skip(-5)} size="icon" type="button">
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            onClick={togglePlay}
            size="icon"
            type="button"
            className="h-12 w-12 rounded-full"
            disabled={!src || !!error || !isReady}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button onClick={() => skip(5)} size="icon" type="button">
            <RotateCw className="h-4 w-4" />
          </Button>

          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 accent-zinc-900"
            disabled={!isReady}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              {volumeIcon}
            </button>

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-zinc-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-zinc-500" />
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700"
            >
              {speeds.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="inline-flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
