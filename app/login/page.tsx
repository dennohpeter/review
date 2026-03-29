import { LoginPage } from '@/app/pages/LoginPage'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return <LoginPage />
}
