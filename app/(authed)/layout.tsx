import { Layout } from '@/app/components/Layout'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserRole } from '@/app/types'
import { getDicebearAvatar } from '@/app/lib/dicebear'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role,name')
    .eq('user_id', user.id)
    .single()

  return (
    <Layout
      user={{
        id: user.id,
        name:
          user.user_metadata?.name ??
          profile?.name ??
          user.email?.split('@')[0] ??
          'User',
        email: user.email ?? '',
        role: profile?.role as UserRole,
        avatar: getDicebearAvatar({ seed: user.id }),
      }}
    >
      {children}
    </Layout>
  )
}
