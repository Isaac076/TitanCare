export type DocType =
  | 'mri'
  | 'airport'
  | 'postop'
  | 'implant_sheet'
  | 'faq'

export interface Patient {
  id: string
  first_name: string
  last_name: string
  dob: string | null
  physician_id: string | null
  created_at: string
}

export interface Implant {
  id: string
  patient_id: string
  model: string | null
  serial_number: string | null
  lot_number: string | null
  implant_date: string | null
  size_length: number | null
  size_girth: number | null
}

export interface Physician {
  id: string
  full_name: string
  specialty: string | null
  clinic_name: string | null
  phone: string | null
  email: string | null
}

export interface Document {
  id: string
  patient_id: string
  doc_type: DocType
  storage_path: string
  is_private: boolean
  version: number
  created_at: string
}

export interface AccessToken {
  id: string
  patient_id: string
  token: string
  is_active: boolean
  created_at: string
}

// Composed view returned to the patient portal
export interface PatientPortalData {
  patient: Pick< Patient,'first_name' | 'last_name' | 'display_name' | 'photo_url' >
  implant: Pick<Implant, 'implant_date' | 'model'> | null
  physician: Pick<Physician, 'full_name' | 'phone' | 'clinic_name'> | null
  publicDocs: Array<{ doc_type: DocType; id: string }>
  privateDocsAvailable: boolean
  pinIsSet: boolean
}

export interface Database {
  public: {
    Tables: {
      patients: { Row: Patient }
      implants: { Row: Implant }
      physicians: { Row: Physician }
      documents: { Row: Document }
      access_tokens: { Row: AccessToken }
    }
  }
}
