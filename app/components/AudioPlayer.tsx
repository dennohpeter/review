'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { Button } from './ui/Button'
import { cn } from '@/app/lib/utils'

interface AudioPlayerProps {
  src?: string
  duration?: string
  className?: string
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`
}

export function AudioPlayer({ src, duration, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration || 0)
      setIsReady(true)
      setError(null)
    }

    const handleTimeUpdate = () => {
      const current = audio.currentTime || 0
      const total = audio.duration || 0

      setCurrentTime(current)
      setProgress(total > 0 ? (current / total) * 100 : 0)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(100)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    const handleError = () => {
      setError('Failed to load audio.')
      setIsPlaying(false)
      setIsReady(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
    }
  }, [src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setAudioDuration(0)
    setIsReady(false)
    setError(null)

    audio.pause()
    audio.load()
  }, [src])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio || !src) return

    try {
      if (audio.paused) {
        await audio.play()
      } else {
        audio.pause()
      }
    } catch {
      setError('Unable to play audio.')
      setIsPlaying(false)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const nextProgress = Number(e.target.value)
    const total = audio.duration || 0
    const nextTime = (nextProgress / 100) * total

    audio.currentTime = nextTime
    setProgress(nextProgress)
    setCurrentTime(nextTime)
  }

  const waveformBars = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        height: `${Math.max(18, Math.abs(Math.sin(i * 1.7)) * 100)}%`,
        played: (i / 40) * 100 < progress,
      })),
    [progress]
  )

  const displayedDuration =
    duration && duration !== '--:--' ? duration : formatTime(audioDuration)

  return (
    <div
      className={cn(
        'bg-zinc-50 rounded-lg border border-zinc-200 p-4',
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          size="icon"
          className="rounded-full h-12 w-12 shrink-0"
          onClick={togglePlay}
          disabled={!src || !!error}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-1" />
          )}
        </Button>

        <div className="flex-1 space-y-2">
          <div className="h-12 flex items-center gap-0.5 opacity-80">
            {waveformBars.map((bar) => (
              <div
                key={bar.id}
                className={cn(
                  'w-1 rounded-full transition-all duration-300',
                  bar.played ? 'bg-zinc-900' : 'bg-zinc-300'
                )}
                style={{ height: bar.height }}
              />
            ))}
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            className="w-full"
            disabled={!src || !isReady}
          />

          <div className="flex justify-between text-xs text-zinc-500 font-medium font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{displayedDuration}</span>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex items-center gap-2 text-zinc-400 min-w-[90px]">
          <Volume2 className="h-5 w-5" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  )
}
