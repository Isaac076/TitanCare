import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const patientId = request.headers.get('x-patient-id')
  if (!patientId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()

  // Obtener datos del paciente
  const { data: patient } = await supabase
    .from('patients')
    .select('first_name, last_name, display_name, photo_url, physician_id')
    .eq('id', patientId)
    .single()

  // Obtener implante
  const { data: implant } = await supabase
    .from('implants')
    .select('implant_date, model')
    .eq('patient_id', patientId)
    .single()

  // Obtener médico
  const { data: physician } = await supabase
    .from('physicians')
    .select('full_name, phone, clinic_name')
    .eq('id', patient?.physician_id)
    .single()

  // Documentos globales (para todos los pacientes)
  const { data: globalDocs } = await supabase
    .from('global_documents')
    .select('doc_type, id')

  // Documentos privados del paciente (implant_sheet)
  const { data: privateDocs } = await supabase
    .from('documents')
    .select('doc_type, id')
    .eq('patient_id', patientId)
    .eq('is_private', true)

  // ¿Tiene PIN configurado?
  const { data: pinRecord } = await supabase
    .from('patient_pins')
    .select('is_set')
    .eq('patient_id', patientId)
    .single()

  return NextResponse.json({
    patient,
    implant,
    physician,
    globalDocs: globalDocs ?? [],
    privateDocs: privateDocs ?? [],
    pinIsSet: pinRecord?.is_set ?? false,
  })
}
