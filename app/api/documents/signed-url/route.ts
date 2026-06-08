import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const SIGNED_URL_EXPIRY = 15 * 60 // 15 minutos

const GLOBAL_DOC_TYPES = ['mri', 'airport', 'postop', 'postop_genesis', 'faq', 'faq_es', 'faq_en']

export async function POST(request: NextRequest) {
  try {
    const { patientId, docType, isGlobal } = await request.json()

    if (!patientId || !docType) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let resolvedDocType = docType

    // Si es postop, verificar si el paciente tiene Genesis
    if (docType === 'postop') {
      const { data: implant } = await supabase
        .from('implants')
        .select('model')
        .eq('patient_id', patientId)
        .single()

      if (implant?.model === 'Genesis') {
        resolvedDocType = 'postop_genesis'
      }
    }

    let storagePath: string | null = null

    if (isGlobal || GLOBAL_DOC_TYPES.includes(resolvedDocType)) {
      const { data: doc, error } = await supabase
        .from('global_documents')
        .select('storage_path')
        .eq('doc_type', resolvedDocType)
        .single()

      if (error || !doc) {
        // Fallback a postop estándar si no existe postop_genesis
        if (resolvedDocType === 'postop_genesis') {
          const { data: fallback } = await supabase
            .from('global_documents')
            .select('storage_path')
            .eq('doc_type', 'postop')
            .single()
          if (fallback) {
            storagePath = fallback.storage_path
          } else {
            return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
          }
        } else {
          console.error('global_documents error:', error, 'docType:', resolvedDocType)
          return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
        }
      } else {
        storagePath = doc.storage_path
      }
    } else {
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

    const { data: signedData, error: signedError } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(storagePath!, SIGNED_URL_EXPIRY)

    if (signedError || !signedData) {
      console.error('createSignedUrl error:', signedError)
      return NextResponse.json({ error: 'Error al generar enlace' }, { status: 500 })
    }

    await supabase.from('access_logs').insert({
      patient_id: patientId,
      doc_type: resolvedDocType,
    })

    return NextResponse.json({ url: signedData.signedUrl })
  } catch (err) {
    console.error('signed-url error:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
