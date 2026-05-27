'use client'

import { useState, useRef } from 'react'
import { useApiFetch } from '@/lib/token-context'
import { X, Camera, User, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  patientId: string
  currentName: string
  currentPhoto: string | null
  onSuccess: (name: string, photoUrl: string | null) => void
  onClose: () => void
}

export function EditProfile({ patientId, currentName, currentPhoto, onSuccess, onClose }: Props) {
  const [name, setName] = useState(currentName)
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentPhoto)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 5MB')
      return
    }

    setPhotoFile(file)
    setError('')

    // Preview inmediato
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const apiFetch = useApiFetch()

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setError('El nombre es muy corto')
      return
    }

    setLoading(true)
    setError('')

    try {
      let finalPhotoUrl = currentPhoto

      // Subir foto si se seleccionó una nueva
      if (photoFile) {
        const formData = new FormData()
        formData.append('photo', photoFile)

        const photoRes = await apiFetch('/api/patient/photo', {
          method: 'POST',
          body: formData,
        })

        if (!photoRes.ok) {
          const data = await photoRes.json()
          throw new Error(data.error ?? 'Error al subir foto')
        }

        const { url } = await photoRes.json()
        finalPhotoUrl = url
      }

      // Actualizar nombre
      const nameRes = await apiFetch('/api/patient/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim() }),
      })

      if (!nameRes.ok) throw new Error('Error al guardar nombre')

      setSuccess(true)
      setTimeout(() => onSuccess(name.trim(), finalPhotoUrl), 1200)
    } catch (err: any) {
      setError(err.message ?? 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-navy-900 border border-white/10 rounded-[24px] p-6">

        <div className="flex items-center justify-between mb-6">
          <p className="text-white font-medium">Editar perfil</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white font-medium">¡Perfil actualizado!</p>
          </div>
        ) : (
          <>
            {/* Foto */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-brand-600 to-sky-400 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-600 border-2 border-navy-900 flex items-center justify-center"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <p className="text-slate-400 text-[11px] mt-2">Toca el ícono para cambiar la foto</p>

              {/* Input oculto — acepta cámara en móvil */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Nombre */}
            <div className="mb-5">
              <label className="text-slate-400 text-[11px] font-medium uppercase tracking-wide mb-1.5 block">
                Nombre para mostrar
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                placeholder="Tu nombre completo"
                className="w-full bg-white/5 border border-white/10 rounded-[12px] px-4 py-3 text-white text-[14px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 mb-4">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-[12px] py-3.5 flex items-center justify-center gap-2 font-medium text-[14px] transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
