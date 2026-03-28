import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { User } from '@/app/types'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { data: reviewerProfiles, error } = await supabase
    .from('profiles')
    .select('user_id, role')
    .eq('role', 'reviewer')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const reviewers: User[] = await Promise.all(
    (reviewerProfiles ?? []).map(async (row) => {
      const { data: userData } = await supabase.auth.admin.getUserById(
        row.user_id
      )

      return {
        id: row.user_id,
        role: 'reviewer',
        name:
          (userData.user?.user_metadata?.name as string | undefined) ??
          userData.user?.email?.split('@')[0] ??
          'Reviewer',
        email: userData.user?.email ?? '',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user_id}`,
      }
    })
  )

  return NextResponse.json({ reviewers })
}
