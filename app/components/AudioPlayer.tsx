import React, { useEffect, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { Button } from './ui/Button'
import { cn } from '../lib/utils'
interface AudioPlayerProps {
  src?: string // Mock src
  duration?: string
  className?: string
}
export function AudioPlayer({
  src,
  duration = '00:00',
  className,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  // Mock progress simulation
  useEffect(() => {
    let interval: any
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.5
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying])
  const togglePlay = () => setIsPlaying(!isPlaying)
  return (
    <div
      className={cn(
        'bg-zinc-50 rounded-lg border border-zinc-200 p-4',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="primary"
          size="icon"
          className="rounded-full h-12 w-12 shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-1" />
          )}
        </Button>

        <div className="flex-1 space-y-2">
          {/* Waveform Visualization (Mock) */}
          <div className="h-12 flex items-center gap-0.5 opacity-80">
            {Array.from({
              length: 40,
            }).map((_, i) => {
              // Create a random-looking but static waveform pattern
              const height = Math.max(20, Math.sin(i * 0.5) * 100)
              const isPlayed = (i / 40) * 100 < progress
              return (
                <div
                  key={i}
                  className={cn(
                    'w-1 rounded-full transition-all duration-300',
                    isPlayed ? 'bg-zinc-900' : 'bg-zinc-300'
                  )}
                  style={{
                    height: `${Math.abs(Math.sin(i * 132) * 100)}%`,
                  }}
                />
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="relative h-1 bg-zinc-200 rounded-full w-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-zinc-900 transition-all duration-100"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-zinc-500 font-medium font-mono">
            <span>
              {Math.floor((progress / 100) * 120)}:
              {(Math.floor((progress / 100) * 120) % 60)
                .toString()
                .padStart(2, '0')}
            </span>
            <span>{duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Volume2 className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
