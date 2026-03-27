'use client'

import { useRouter } from 'next/navigation'
import { AdminUpload } from '@/app/pages/AdminUpload'

export default function UploadPage() {
  const router = useRouter()

  const onNavigate = (page: string) => {
    if (page === 'dashboard') router.push('/')
    else if (page === 'invite') router.push('/invite')
    else router.push('/')
  }

  return <AdminUpload onNavigate={onNavigate} />
}
