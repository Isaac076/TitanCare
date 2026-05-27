import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Clave de acceso para el registro — cámbiala en producción
const REGISTER_KEY = process.env.REGISTER_KEY ?? 'TITAN2024'

export async function POST(request: NextRequest) {
  try {
    const { accessKey, firstName, lastName, implantDate, model } = await request.json()

    // Verificar clave de acceso
    if (accessKey !== REGISTER_KEY) {
      return NextResponse.json({ error: 'Clave de acceso incorrecta' }, { status: 401 })
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'Nombre y apellido son requeridos' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1 — Crear paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      .select('id')
      .single()

    if (patientError || !patient) {
      throw new Error('Error al crear paciente')
    }

    // 2 — Crear implante
    await supabase.from('implants').insert({
      patient_id: patient.id,
      model: model?.trim() || 'Titan OTR',
      implant_date: implantDate || null,
    })

    // 3 — Generar token único
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_patient_token')

    if (tokenError) throw new Error('Error al generar token')

    // 4 — Guardar token
    await supabase.from('access_tokens').insert({
      patient_id: patient.id,
      token: tokenData,
      label: 'Tarjeta NFC',
    })

    return NextResponse.json({
      success: true,
      patientId: patient.id,
      token: tokenData,
    })
  } catch (err: any) {
    console.error('Register error:', err)
    return NextResponse.json({ error: err.message ?? 'Error al registrar' }, { status: 500 })
  }
}
