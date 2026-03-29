import { getDicebearAvatar } from '@/app/lib/dicebear'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, role, name, email')
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const users = (data ?? []).map((row) => ({
    id: row.user_id,
    role: row.role,
    name: row.name ?? row.email?.split('@')[0] ?? 'User',
    email: row.email ?? '',
    avatar: getDicebearAvatar({ seed: row.user_id }),
  }))

  return NextResponse.json({ users })
}
