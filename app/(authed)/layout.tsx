import { Layout } from '@/app/components/Layout'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <Layout>{children}</Layout>
}
