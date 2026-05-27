import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Clave de acceso para el registro — cámbiala en producción
const REGISTER_KEY = process.env.REGISTER_KEY ?? 'TITAN2024'

// URL pública de producción
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://titan-care.vercel.app'

export async function POST(request: NextRequest) {
  try {
    const { accessKey, firstName, lastName, implantDate, model } = await request.json()

    if (accessKey !== REGISTER_KEY) {
      return NextResponse.json({ error: 'Clave de acceso incorrecta' }, { status: 401 })
    }

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'Nombre y apellido son requeridos' }, { status: 400 })
    }

    const supabase = createAdminClient()

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

    await supabase.from('implants').insert({
      patient_id: patient.id,
      model: model?.trim() || 'Titan OTR',
      implant_date: implantDate || null,
    })

    const { data: tokenData, error: tokenError } = await supabase.rpc('generate_patient_token')

    if (tokenError || !tokenData) {
      throw new Error('Error al generar token')
    }

    const token = String(tokenData)

    const { error: accessTokenError } = await supabase.from('access_tokens').insert({
      patient_id: patient.id,
      token,
      label: 'Tarjeta NFC',
    })

    if (accessTokenError) {
      throw new Error('Error al guardar token de acceso')
    }

    const portalUrl = `${BASE_URL}/p/${token}`

    return NextResponse.json({
      success: true,
      patientId: patient.id,
      token,
      portalUrl,
    })
  } catch (err: any) {
    console.error('Register error:', err)
    return NextResponse.json(
      { error: err.message ?? 'Error al registrar' },
      { status: 500 }
    )
  }
}