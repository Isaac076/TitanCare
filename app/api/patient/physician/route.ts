import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  console.log('GET physician - patientId:', patientId)
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const { data: patient } = await supabase.from('patients').select('physician_id').eq('id', patientId).single()
  console.log('GET physician - physician_id:', patient?.physician_id)
  if (!patient?.physician_id) return NextResponse.json(null)
  const { data: physician } = await supabase.from('physicians').select('id, full_name, phone, email').eq('id', patient.physician_id).single()
  return NextResponse.json(physician ?? null)
}

export async function POST(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  console.log('POST physician - patientId:', patientId)
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { full_name, phone, email } = await request.json()
    if (!full_name || full_name.trim().length < 2) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    const supabase = createAdminClient()
    const { data: patient } = await supabase.from('patients').select('physician_id').eq('id', patientId).single()
    if (patient?.physician_id) {
      await supabase.from('physicians').update({ full_name, phone, email }).eq('id', patient.physician_id)
    } else {
      const { data: newPhysician } = await supabase.from('physicians').insert({ full_name, phone, email }).select('id').single()
      await supabase.from('patients').update({ physician_id: newPhysician?.id }).eq('id', patientId)
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
