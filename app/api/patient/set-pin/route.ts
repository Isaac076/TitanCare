import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function hashPin(pin: string, patientId: string): string {
  return crypto
    .createHmac('sha256', process.env.PIN_SALT!)
    .update(`${patientId}:${pin}`)
    .digest('hex')
}

// POST /api/patient/set-pin — paciente crea o cambia su PIN
export async function POST(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { pin, currentPin } = await request.json()

    // Validar formato del nuevo PIN
    if (!pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'El PIN debe ser de 4 dígitos' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verificar si ya tiene un PIN configurado
    const { data: existing } = await supabase
      .from('patient_pins')
      .select('pin_hash, is_set')
      .eq('patient_id', patientId)
      .single()

    // Si ya tiene PIN, verificar el PIN actual antes de cambiar
    if (existing?.is_set && currentPin) {
      const currentHash = hashPin(currentPin, patientId)
      if (currentHash !== existing.pin_hash) {
        return NextResponse.json({ error: 'PIN actual incorrecto' }, { status: 401 })
      }
    }

    const newHash = hashPin(pin, patientId)

    if (existing) {
      // Actualizar PIN existente
      await supabase
        .from('patient_pins')
        .update({ pin_hash: newHash, is_set: true, set_at: new Date().toISOString() })
        .eq('patient_id', patientId)
    } else {
      // Crear PIN nuevo
      await supabase
        .from('patient_pins')
        .insert({ patient_id: patientId, pin_hash: newHash, is_set: true, set_at: new Date().toISOString() })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
