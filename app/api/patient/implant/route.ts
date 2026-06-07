import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('implants')
    .select('model, implant_date, lote_cilindros, lote_reservorio, lote_kit_ensamble, hoja_foto_url')
    .eq('patient_id', patientId)
    .single()

  if (error) return NextResponse.json(null)
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { model, lote_cilindros, lote_reservorio, lote_kit_ensamble } = body

    const supabase = createAdminClient()

    // Verificar si ya existe un registro
    const { data: existing } = await supabase
      .from('implants')
      .select('id')
      .eq('patient_id', patientId)
      .single()

    const updates: Record<string, any> = {
      lote_cilindros: lote_cilindros || null,
      // Si es Genesis, guardar null en reservorio y kit
      lote_reservorio: model === 'Genesis' ? null : (lote_reservorio || null),
      lote_kit_ensamble: model === 'Genesis' ? null : (lote_kit_ensamble || null),
    }

    // Solo actualizar model si viene en el body
    if (model !== undefined) {
      updates.model = model || null
    }

    if (existing) {
      await supabase
        .from('implants')
        .update(updates)
        .eq('patient_id', patientId)
    } else {
      await supabase
        .from('implants')
        .insert({ patient_id: patientId, ...updates })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Implant save error:', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
