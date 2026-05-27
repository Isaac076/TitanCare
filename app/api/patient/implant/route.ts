import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// GET — obtener datos del implante
export async function GET(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('implants')
    .select('model, implant_date, serial_number, lot_number, size_length, size_girth, lote_cilindros, lote_reservorio, lote_kit_ensamble, hoja_foto_url')
    .eq('patient_id', patientId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Implante no encontrado' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// POST — guardar datos del implante
export async function POST(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { lote_cilindros, lote_reservorio, lote_kit_ensamble } = body

    const supabase = createAdminClient()

    // Verificar si ya existe un implante para este paciente
    const { data: existing } = await supabase
      .from('implants')
      .select('id')
      .eq('patient_id', patientId)
      .single()

    if (existing) {
      // Actualizar
      await supabase
        .from('implants')
        .update({ lote_cilindros, lote_reservorio, lote_kit_ensamble })
        .eq('patient_id', patientId)
    } else {
      // Crear nuevo
      await supabase
        .from('implants')
        .insert({ patient_id: patientId, lote_cilindros, lote_reservorio, lote_kit_ensamble })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('implant save error:', err)
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
