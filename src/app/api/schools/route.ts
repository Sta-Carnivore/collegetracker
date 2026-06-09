import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const { data, error } = await supabase
    .from('schools')
    .select('id, name, acceptance_rate, sat_25th, sat_75th, rounds_offered, deadline_ea, deadline_ed, deadline_rolling')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(20)

  if (error) {
    console.error('[schools search]', error.message)
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 })
  }
  return NextResponse.json(data)
}
