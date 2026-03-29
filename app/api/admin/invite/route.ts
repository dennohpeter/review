import { supabaseAdmin } from '@/app/lib/supabase/admin'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
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

    const body = await req.json()
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase()
    const name = String(body.name ?? '').trim()
    const role = body.role === 'admin' ? 'admin' : 'reviewer'

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and Full Name required' },
        { status: 400 }
      )
    }

    const { data: createdUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name,
          role,
        },
      })

    if (createError || !createdUser.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    const userId = createdUser.user.id

    const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
      user_id: userId,
      role,
      name,
      email,
    })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 400 })
    }

    return NextResponse.json({
      user: {
        id: userId,
        email,
        name,
        role,
      },
    })
  } catch (err) {
    console.error('Error inviting user:', err)
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    )
  }
}
