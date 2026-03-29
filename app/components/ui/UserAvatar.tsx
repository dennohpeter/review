import { useState } from 'react'
import Image from 'next/image'
import { getDicebearAvatar } from '@/app/lib/dicebear'

export function UserAvatar({
  id,
  name,
  size = 40,
}: {
  id: string
  name: string
  size?: number
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {!imgError ? (
        <Image
          src={getDicebearAvatar({ seed: id, size })}
          alt={name}
          width={size}
          height={size}
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <span className="text-zinc-500 font-medium">{name.charAt(0)}</span>
      )}
    </div>
  )
}
