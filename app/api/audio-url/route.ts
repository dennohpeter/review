import { BUCKET, s3 } from '@/app/lib'
import { createSupabaseServerClient } from '@/app/lib/supabase/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient()

    // 🔐 ensure user is logged in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const audioId = searchParams.get('audioId')

    if (!audioId) {
      return NextResponse.json(
        { error: 'audioId is required' },
        { status: 400 }
      )
    }

    // 🔍 fetch audio_key from DB
    const { data, error } = await supabase
      .from('audio_items')
      .select('audio_key')
      .eq('id', audioId)
      .single()

    if (error || !data?.audio_key) {
      return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
    }

    // 🔐 generate signed URL
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: data.audio_key,
    })

    const url = await getSignedUrl(s3, command, {
      expiresIn: 60 * 60, // 1 hour
    })

    return NextResponse.json({ url })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to generate audio URL' },
      { status: 500 }
    )
  }
}
