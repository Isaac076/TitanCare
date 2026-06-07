import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const SIGNED_URL_EXPIRY = 15 * 60 // 15 minutos

// Documentos globales (compartidos para todos los pacientes)
const GLOBAL_DOC_TYPES = ['mri', 'airport', 'postop', 'faq', 'faq_es', 'faq_en']

export async function POST(request: NextRequest) {
  try {
    const { patientId, docType, isGlobal } = await request.json()

    if (!patientId || !docType) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let storagePath: string | null = null

    if (isGlobal || GLOBAL_DOC_TYPES.includes(docType)) {
      // Documento global compartido para todos los pacientes
      const { data: doc, error } = await supabase
        .from('global_documents')
        .select('storage_path')
        .eq('doc_type', docType)
        .single()

      if (error || !doc) {
        console.error('global_documents error:', error, 'docType:', docType)
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
      }

      storagePath = doc.storage_path
    } else {
      // Documento privado del paciente — requiere sesión PIN activa
      const { data: session } = await supabase
        .from('pin_sessions')
        .select('id')
        .eq('patient_id', patientId)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!session) {
        return NextResponse.json({ error: 'PIN requerido' }, { status: 403 })
      }

      const { data: doc, error } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('patient_id', patientId)
        .eq('doc_type', docType)
        .single()

      if (error || !doc) {
        return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
      }

      storagePath = doc.storage_path
    }

    // Generar URL firmada (15 min)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

    if (signedError || !signedData) {
      console.error('createSignedUrl error:', signedError)
      return NextResponse.json({ error: 'Error al generar enlace' }, { status: 500 })
    }

    // Log de acceso
    await supabase.from('access_logs').insert({
      patient_id: patientId,
      doc_type: docType,
    })

    return NextResponse.json({ url: signedData.signedUrl })
  } catch (err) {
    console.error('signed-url error:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
