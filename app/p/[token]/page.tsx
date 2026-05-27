import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import type { PatientPortalData } from '@/lib/types'
import { PatientPortal } from '@/components/portal/PatientPortal'
import { TokenProvider } from '@/lib/token-context'

interface Props {
  params: { token: string }
}

async function getPortalData(patientId: string): Promise<PatientPortalData | null> {
  const supabase = createAdminClient()

  const { data: patient, error } = await supabase
    .from('patients')
    .select(`
      first_name,
      last_name,
      display_name,
      photo_url,
      physician_id,
      implants (
        implant_date,
        model
      )
    `)
    .eq('id', patientId)
    .single()

  if (error || !patient) return null

  return {
    patient: {
      first_name: patient.first_name,
      last_name: patient.last_name,
      display_name: patient.display_name ?? null,
      photo_url: patient.photo_url ?? null,
    },
    implant: (patient.implants as any[])?.[0] ?? null,
    physician: null,
    publicDocs: [],
    privateDocsAvailable: true,
    pinIsSet: false,
  }
}

export default async function PatientPortalPage({ params }: Props) {
  const headersList = headers()
  const patientId = headersList.get('x-patient-id')
  const tokenId = headersList.get('x-token-id')

  if (!patientId || !tokenId) notFound()

  const portalData = await getPortalData(patientId!)

  if (!portalData) notFound()

  // Check if PIN is set
  const supabase = createAdminClient()
  const { data: pinRecord } = await supabase
    .from('patient_pins')
    .select('is_set')
    .eq('patient_id', patientId!)
    .single()

  portalData.pinIsSet = pinRecord?.is_set ?? false

  // Log access
  supabase
    .from('access_logs')
    .insert({ patient_id: patientId, token_id: tokenId, doc_type: 'portal_open' })
    .then(() => {})

  return (
    <TokenProvider token={params.token}>
      <PatientPortal data={portalData} patientId={patientId!} />
    </TokenProvider>
  )
}
