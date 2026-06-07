export type DocType = 'mri' | 'airport' | 'postop' | 'implant_sheet' | 'faq' | 'faq_es' | 'faq_en'

export interface PatientPortalData {
  patient: {
    first_name: string
    last_name: string
    display_name: string | null
    photo_url: string | null
  }
  implant: {
    implant_date: string | null
    model: string | null
  } | null
  physician: {
    full_name: string
    specialty: string | null
    clinic_name: string | null
    phone: string | null
    email: string | null
  } | null
  publicDocs: { doc_type: string; id: string }[]
  privateDocsAvailable: boolean
  pinIsSet: boolean
}
