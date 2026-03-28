import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
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

  const body = await req.json()
  const taskIds = Array.isArray(body.taskIds) ? body.taskIds : []
  const assignedTo = body.assignedTo ?? null

  if (!taskIds.length) {
    return NextResponse.json({ error: 'taskIds required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('audio_items')
    .update({ assigned_to: assignedTo })
    .in('id', taskIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
