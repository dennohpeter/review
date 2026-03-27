import { LoginPage } from '@/app/pages/LoginPage'
import { createSupabaseServerClient } from '../lib/supabase/server'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const user = await supabase.auth.getUser()

  console.log('User in LoginPage:', user)
  return <LoginPage />
}
