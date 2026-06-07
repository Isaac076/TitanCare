'use client'

import { useState, useEffect, useRef } from 'react'
import { useApiFetch } from '@/lib/token-context'
import { useLang } from '@/lib/lang-context'
import { Lock, X, Camera, ImageIcon, Save, CheckCircle2, AlertCircle, Loader2, BadgeInfo, ZoomIn } from 'lucide-react'

type ImplantModel = 'Titan Touch' | 'Titan NB' | 'Genesis' | ''

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

const MODELS: ImplantModel[] = ['Titan Touch', 'Titan NB', 'Genesis']

export function ImplantDetails({ patientId, onChangePin, onClose }: Props) {
  const { t, lang } = useLang()
  const apiFetch = useApiFetch()
  const [data, setData] = useState<ImplantData | null>(null)
  const [model, setModel] = useState<ImplantModel>('')
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
  const [showPhotoOptions, setShowPhotoOptions] = useState(false)

  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await apiFetch('/api/patient/implant')
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setModel((d.model as ImplantModel) ?? '')
        setLoteCilindros(d.lote_cilindros ?? '')
        setLoteReservorio(d.lote_reservorio ?? '')
        setLoteKit(d.lote_kit_ensamble ?? '')
        setFotoPreview(d.hoja_foto_url ?? null)
      }
    } catch {
      setError(t('implant_error_load'))
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError(t('implant_error_type')); return }
    if (file.size > 10 * 1024 * 1024) { setError(t('implant_error_size')); return }
    setFotoFile(file)
    setError('')
    setShowPhotoOptions(false)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
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
        if (!photoRes.ok) throw new Error(t('implant_error_photo'))
        setUploadingPhoto(false)
      }
      const body = {
        model,
        lote_cilindros,
        lote_reservorio: model === 'Genesis' ? null : lote_reservorio,
        lote_kit_ensamble: model === 'Genesis' ? null : lote_kit_ensamble,
      }
      const res = await apiFetch('/api/patient/implant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(t('implant_error_save'))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err: any) {
      setError(err.message ?? t('implant_error_save'))
    } finally {
      setSaving(false)
      setUploadingPhoto(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-MX', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(date))
  }

  const genesis = model === 'Genesis'

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
                <p className="text-white font-medium text-[14px]">{t('implant_title')}</p>
                <p className="text-slate-500 text-[11px]">{t('implant_subtitle')}</p>
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
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{t('implant_date')}</p>
                  <p className="text-white text-[13px] font-medium">{formatDate(data.implant_date)}</p>
                </div>
              )}

              {/* Selector modelo */}
              <div className="mb-5">
                <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400 mb-2">{t('implant_type')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {MODELS.map(m => (
                    <button key={m} onClick={() => setModel(m)} className={`py-2.5 px-2 rounded-[10px] text-[12px] font-medium border transition-all ${model === m ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}>
                      {m}
                    </button>
                  ))}
                </div>
                {genesis && (
                  <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-[10px] px-3 py-2">
                    <p className="text-[11px] text-amber-300">{t('implant_genesis_note')}</p>
                  </div>
                )}
              </div>

              {/* Lotes */}
              <div className="space-y-3 mb-5">
                <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400">{t('implant_lots')}</p>
                <div>
                  <label className="text-slate-400 text-[11px] mb-1 block">{t('implant_lot_cyl')}</label>
                  <input type="text" value={lote_cilindros} onChange={e => setLoteCilindros(e.target.value)} placeholder="CYL-2024-001" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors" />
                </div>
                {!genesis && (
                  <>
                    <div>
                      <label className="text-slate-400 text-[11px] mb-1 block">{t('implant_lot_res')}</label>
                      <input type="text" value={lote_reservorio} onChange={e => setLoteReservorio(e.target.value)} placeholder="RES-2024-001" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors" />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] mb-1 block">{t('implant_lot_kit')}</label>
                      <input type="text" value={lote_kit_ensamble} onChange={e => setLoteKit(e.target.value)} placeholder="KIT-2024-001" className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors" />
                    </div>
                  </>
                )}
              </div>

              {/* Foto */}
              <div className="mb-5">
                <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400 mb-2">{t('implant_photo')}</p>
                {fotoPreview ? (
                  <div className="relative">
                    <img src={fotoPreview} alt="Hoja" className="w-full rounded-[12px] object-cover max-h-48 cursor-pointer" onClick={() => setZoomPhoto(true)} />
                    <button onClick={() => setZoomPhoto(true)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={() => setShowPhotoOptions(v => !v)} className="mt-2 w-full bg-white/5 border border-white/10 rounded-[10px] py-2 text-[12px] text-slate-400 flex items-center justify-center gap-2">
                      <Camera className="w-3.5 h-3.5" />{t('implant_photo_change')}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowPhotoOptions(v => !v)} className="w-full bg-white/5 border border-dashed border-white/20 rounded-[12px] py-6 flex flex-col items-center gap-2">
                    <Camera className="w-6 h-6 text-slate-500" />
                    <p className="text-[12px] text-slate-500">{t('implant_photo_add')}</p>
                  </button>
                )}
                {showPhotoOptions && (
                  <div className="mt-2 bg-white/5 border border-white/10 rounded-[14px] overflow-hidden">
                    <button onClick={() => { setShowPhotoOptions(false); cameraRef.current?.click() }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 border-b border-white/5 text-left transition-colors">
                      <Camera className="w-4 h-4 text-brand-400" />
                      <span className="text-white text-[14px]">{t('edit_camera')}</span>
                    </button>
                    <button onClick={() => { setShowPhotoOptions(false); libraryRef.current?.click() }} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 text-left transition-colors">
                      <ImageIcon className="w-4 h-4 text-brand-400" />
                      <span className="text-white text-[14px]">{t('edit_library')}</span>
                    </button>
                  </div>
                )}
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelected} className="hidden" />
                <input ref={libraryRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
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
                  <p className="text-[12px] text-emerald-300">{t('implant_saved')}</p>
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-[12px] py-3.5 flex items-center justify-center gap-2 font-medium text-[14px] transition-colors mb-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {uploadingPhoto ? t('implant_uploading') : t('implant_saving')}</> : <><Save className="w-4 h-4" /> {t('implant_save')}</>}
              </button>
              <button onClick={onChangePin} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-[12px] py-3 flex items-center justify-center gap-2 text-[13px] transition-colors">
                <Lock className="w-4 h-4" />{t('implant_change_pin')}
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
