import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('photo') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen no puede pesar más de 10MB' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const ext = file.type.includes('png') ? 'png' : 'jpg'
    const path = `implant-sheets/${patientId}/hoja.${ext}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from('patient-documents')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw uploadError

    // URL firmada con validez de 10 años
    const { data: signedData, error: signedError } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)

    if (signedError || !signedData) throw signedError

    // Guardar URL en el implante
    await supabase
      .from('implants')
      .update({ hoja_foto_url: signedData.signedUrl })
      .eq('patient_id', patientId)

    return NextResponse.json({ url: signedData.signedUrl })
  } catch (err: any) {
    console.error('Implant photo error:', err)
    return NextResponse.json({ error: err?.message ?? 'Error al subir foto' }, { status: 500 })
  }
}
