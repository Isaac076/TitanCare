import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('1. Body recibido:', body)

    const { patientId, docType, isGlobal } = body
    const supabase = createAdminClient()
    console.log('2. Supabase client creado')

    const { data: doc, error } = await supabase
      .from('global_documents')
      .select('storage_path')
      .eq('doc_type', docType)
      .single()

    console.log('3. Documento:', doc)
    console.log('3. Error:', error)

    if (error || !doc) {
      return NextResponse.json({ error: 'Documento no encontrado', detail: error }, { status: 404 })
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(doc.storage_path, 900)

    console.log('4. SignedData:', signedData)
    console.log('4. SignedError:', signedError)

    if (signedError || !signedData) {
      return NextResponse.json({ error: 'Error al generar enlace', detail: signedError }, { status: 500 })
    }

    return NextResponse.json({ url: signedData.signedUrl })
  } catch (err) {
    console.error('ERROR CATCH:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}