'use client'

import { createBrowserClient } from '@supabase/ssr'

const createSupabaseBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  return createBrowserClient(supabaseUrl, supabaseKey)
}

export const supabase = createSupabaseBrowserClient()
