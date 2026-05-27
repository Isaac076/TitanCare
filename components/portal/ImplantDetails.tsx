'use client'

import { useState, useEffect, useRef } from 'react'
import { useApiFetch } from '@/lib/token-context'
import {
  Lock, X, Camera, Save, CheckCircle2, AlertCircle,
  Loader2, BadgeInfo, ZoomIn
} from 'lucide-react'

interface ImplantData {
  model: string | null
  implant_date: string | null
  lote_cilindros: string | null
  lote_reservorio: string | null
  lote_kit_ensamble: string | null
  hoja_foto_url: string | null
}

interface Props {
  patientId: string
  onChangePin: () => void
  onClose: () => void
}

export function ImplantDetails({ patientId, onChangePin, onClose }: Props) {
  const apiFetch = useApiFetch()
  const [data, setData] = useState<ImplantData | null>(null)
  const [lote_cilindros, setLoteCilindros] = useState('')
  const [lote_reservorio, setLoteReservorio] = useState('')
  const [lote_kit_ensamble, setLoteKit] = useState('')
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [zoomPhoto, setZoomPhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await apiFetch('/api/patient/implant')
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setLoteCilindros(d.lote_cilindros ?? '')
        setLoteReservorio(d.lote_reservorio ?? '')
        setLoteKit(d.lote_kit_ensamble ?? '')
        setFotoPreview(d.hoja_foto_url ?? null)
      }
    } catch {
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Solo imagenes'); return }
    if (file.size > 10 * 1024 * 1024) { setError('Maximo 10MB'); return }
    setFotoFile(file)
    setError('')
    const reader = new FileReader()
    reader.onload = e => setFotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      if (fotoFile) {
        setUploadingPhoto(true)
        const formData = new FormData()
        formData.append('photo', fotoFile)
        const photoRes = await apiFetch('/api/patient/implant-photo', { method: 'POST', body: formData })
        if (!photoRes.ok) throw new Error('Error al subir foto')
        setUploadingPhoto(false)
      }
      const res = await apiFetch('/api/patient/implant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lote_cilindros, lote_reservorio, lote_kit_ensamble }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
      setUploadingPhoto(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('es-MX', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date))
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-sm bg-navy-900 border border-white/10 rounded-[24px] p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-violet-500/15 flex items-center justify-center">
                <BadgeInfo className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-white font-medium text-[14px]">Detalles del Implante</p>
                <p className="text-slate-500 text-[11px]">Informacion del dispositivo</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            </div>
          ) : (
            <>
              {data && (
                <div className="bg-white/5 border border-white/10 rounded-[12px] p-4 mb-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Modelo</p>
                      <p className="text-white text-[13px] font-medium">{data.model ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Fecha</p>
                      <p className="text-white text-[13px] font-medium">{formatDate(data.implant_date)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-5">
                <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400">Numeros de lote</p>
                {[
                  { label: 'Lote de Cilindros', value: lote_cilindros, set: setLoteCilindros, placeholder: 'CYL-2024-001' },
                  { label: 'Lote de Reservorio', value: lote_reservorio, set: setLoteReservorio, placeholder: 'RES-2024-001' },
                  { label: 'Lote de Kit de Ensamble', value: lote_kit_ensamble, set: setLoteKit, placeholder: 'KIT-2024-001' },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="text-slate-400 text-[11px] mb-1 block">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors"
                    />
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400 mb-2">Foto de hoja del paciente</p>
                {fotoPreview ? (
                  <div className="relative">
                    <img src={fotoPreview} alt="Hoja" className="w-full rounded-[12px] object-cover max-h-48 cursor-pointer" onClick={() => setZoomPhoto(true)} />
                    <button onClick={() => setZoomPhoto(true)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={() => fileRef.current?.click()} className="mt-2 w-full bg-white/5 border border-white/10 rounded-[10px] py-2 text-[12px] text-slate-400 flex items-center justify-center gap-2">
                      <Camera className="w-3.5 h-3.5" />
                      Cambiar foto
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} className="w-full bg-white/5 border border-dashed border-white/20 rounded-[12px] py-6 flex flex-col items-center gap-2">
                    <Camera className="w-6 h-6 text-slate-500" />
                    <p className="text-[12px] text-slate-500">Toca para tomar o subir foto</p>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFotoChange} className="hidden" />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-[12px] text-red-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-[10px] px-3 py-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-[12px] text-emerald-300">Guardado correctamente!</p>
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-[12px] py-3.5 flex items-center justify-center gap-2 font-medium text-[14px] transition-colors mb-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploadingPhoto ? 'Subiendo foto...' : 'Guardando...'}</> : <><Save className="w-4 h-4" /> Guardar</>}
              </button>

              <button onClick={onChangePin} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-[12px] py-3 flex items-center justify-center gap-2 text-[13px] transition-colors">
                <Lock className="w-4 h-4" />
                Cambiar PIN
              </button>
            </>
          )}
        </div>
      </div>

      {zoomPhoto && fotoPreview && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setZoomPhoto(false)}>
          <img src={fotoPreview} alt="Hoja" className="max-w-full max-h-full rounded-lg" />
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </>
  )
}
