'use client'

import { useRouter } from 'next/navigation'
import { InviteUser } from '@/app/pages/InviteUser'

export default function InvitePage() {
  const router = useRouter()

  const onNavigate = (page: string) => {
    if (page === 'dashboard') router.push('/')
    else router.push('/')
  }

  return <InviteUser onNavigate={onNavigate} />
}
