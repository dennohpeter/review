export function getDicebearAvatar({
  seed,
  style = 'avataaars',
  size = 40,
}: {
  seed: string
  style?: 'avataaars' | 'initials' | 'bottts' | 'identicon'
  size?: number
}) {
  const normalized = seed.trim().toLowerCase()
  const encodedSeed = encodeURIComponent(normalized)

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodedSeed}&size=${size}`
}
