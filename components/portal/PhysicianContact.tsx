'use client'

import { useState, useEffect } from 'react'
import { useApiFetch } from '@/lib/token-context'
import {
  X, Phone, MapPin, Clock, Pencil,
  Save, CheckCircle2, AlertCircle, Loader2, Mail,
  Stethoscope,
} from 'lucide-react'

interface PhysicianData {
  id?: string
  full_name: string
  specialty: string | null
  clinic_name: string | null
  phone: string | null
  email: string | null
}

interface Props {
  patientId: string
  onClose: () => void
}

export function PhysicianContact({ patientId, onClose }: Props) {
  const [physician, setPhysician] = useState<PhysicianData | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => { loadPhysician() }, [])

  const apiFetch = useApiFetch()

  const loadPhysician = async () => {
    try {
      const res = await apiFetch('/api/patient/physician')
      if (res.ok) {
        const data = await res.json()
        setPhysician(data)
        if (data) {
          setFullName(data.full_name ?? '')
          setSpecialty(data.specialty ?? '')
          setClinicName(data.clinic_name ?? '')
          setPhone(data.phone ?? '')
          setEmail(data.email ?? '')
        } else {
          setEditing(true)
        }
      }
    } catch {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (physician) {
      setFullName(physician.full_name ?? '')
      setSpecialty(physician.specialty ?? '')
      setClinicName(physician.clinic_name ?? '')
      setPhone(physician.phone ?? '')
      setEmail(physician.email ?? '')
    }
    setEditing(true)
    setError('')
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('El nombre del medico es requerido')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch('/api/patient/physician', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          specialty: specialty.trim() || null,
          clinic_name: clinicName.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      const updated: PhysicianData = {
        full_name: fullName.trim(),
        specialty: specialty.trim() || null,
        clinic_name: clinicName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      }
      setPhysician(updated)
      setSuccess(true)
      setTimeout(() => { setSuccess(false); setEditing(false) }, 1500)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-navy-900 border border-white/10 rounded-[24px] p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-brand-600/15 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="text-white font-medium text-[14px]">Tu Medico</p>
              <p className="text-slate-500 text-[11px]">{editing ? 'Editar informacion' : 'Informacion de contacto'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && physician && (
              <button onClick={handleEdit} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
          </div>

        ) : editing ? (
          <>
            {success ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-white font-medium">Guardado!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Nombre del medico *', value: fullName, set: setFullName, placeholder: 'Dr. Juan Garcia', type: 'text' },
                  { label: 'Especialidad', value: specialty, set: setSpecialty, placeholder: 'Urologia', type: 'text' },
                  { label: 'Clinica u hospital', value: clinicName, set: setClinicName, placeholder: 'Hospital Angeles', type: 'text' },
                  { label: 'Telefono', value: phone, set: setPhone, placeholder: '+52 55 1234 5678', type: 'tel' },
                  { label: 'Correo electronico', value: email, set: setEmail, placeholder: 'doctor@clinica.com', type: 'email' },
                ].map(({ label, value, set, placeholder, type }) => (
                  <div key={label}>
                    <label className="text-slate-400 text-[11px] mb-1 block">{label}</label>
                    <input
                      type={type}
                      value={value}
                      onChange={e => { set(e.target.value); setError('') }}
                      placeholder={placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors"
                    />
                  </div>
                ))}

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-[12px] text-red-300">{error}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {physician && (
                    <button onClick={() => setEditing(false)} className="flex-1 bg-white/5 border border-white/10 text-slate-300 rounded-[12px] py-3 text-[13px] hover:bg-white/10">
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-[12px] py-3 flex items-center justify-center gap-2 text-[13px] font-medium"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}
          </>

        ) : physician ? (
          <>
            <div className="bg-white/[0.06] border border-white/10 rounded-[14px] p-4 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-600 to-sky-500 flex items-center justify-center text-white font-semibold text-[15px] flex-shrink-0">
                  {physician.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium text-[14px]">{physician.full_name}</p>
                  {physician.specialty && <p className="text-slate-400 text-[11px]">{physician.specialty}</p>}
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-[12px]">
                  <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-400">Lunes - Viernes, 8:00 AM - 5:00 PM</span>
                </div>
                {physician.clinic_name && (
                  <div className="flex items-center gap-2.5 text-[12px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400">{physician.clinic_name}</span>
                  </div>
                )}
                {physician.phone && (
                  <div className="flex items-center gap-2.5 text-[12px]">
                    <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400">{physician.phone}</span>
                  </div>
                )}
                {physician.email && (
                  <div className="flex items-center gap-2.5 text-[12px]">
                    <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-400">{physician.email}</span>
                  </div>
                )}
              </div>
            </div>

            {physician.phone && (
              <a
                href={`tel:${physician.phone}`}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] py-3.5 flex items-center justify-center gap-2 font-medium text-[14px] transition-colors mb-3 active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" />
                Llamar al consultorio
              </a>
            )}

            <div className="bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2.5">
              <p className="text-[11px] text-red-300 text-center leading-relaxed">
                Para emergencias medicas llama al <strong className="text-red-200">911</strong> inmediatamente.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
