import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { displayName } = await request.json()

    if (!displayName || displayName.trim().length < 2) {
      return NextResponse.json({ error: 'Nombre muy corto' }, { status: 400 })
    }

    const supabase = createAdminClient()
    await supabase
      .from('patients')
      .update({ display_name: displayName.trim() })
      .eq('id', patientId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
