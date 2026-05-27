'use client'

import { useState, useEffect } from 'react'
import { useApiFetch } from '@/lib/token-context'
import { X, FileText, Download, AlertCircle, Loader2 } from 'lucide-react'
import type { DocType } from '@/lib/types'

interface Props {
  docType: DocType
  patientId: string
  isGlobal: boolean
  onClose: () => void
}

const DOC_LABELS: Record<DocType, string> = {
  mri:           'Compatibilidad MRI',
  airport:       'Carta para Aeropuerto',
  postop:        'Instrucciones Post-Op',
  implant_sheet: 'Detalles del Implante',
  faq:           'Preguntas Frecuentes',
}

export function DocumentViewer({ docType, patientId, isGlobal, onClose }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSignedUrl() }, [])

  const apiFetch = useApiFetch()

  const fetchSignedUrl = async () => {
    try {
      const res = await apiFetch('/api/documents/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, docType, isGlobal }),
      })
      if (!res.ok) throw new Error('No se pudo cargar el documento')
      const { url } = await res.json()
      setSignedUrl(url)
    } catch {
      setError('No se pudo cargar el documento. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-navy-900 border border-white/10 rounded-[24px] p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-brand-600/15 flex items-center justify-center">
              <FileText className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="text-white font-medium text-[14px]">{DOC_LABELS[docType]}</p>
              <p className="text-slate-500 text-[11px]">Documento PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10 gap-3">
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            <span className="text-slate-400 text-[13px]">Cargando documento...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-[12px] text-red-300">{error}</p>
          </div>
        )}

        {signedUrl && !loading && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-[12px] p-4 mb-4">
              <p className="text-[12px] text-slate-300 leading-relaxed">
                Tu documento está listo. Se abrirá en tu navegador. El enlace expira en 15 minutos por seguridad.
              </p>
            </div>
            <button
              onClick={() => window.open(signedUrl, '_blank', 'noopener,noreferrer')}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] py-3.5 flex items-center justify-center gap-2 font-medium text-[14px] transition-colors active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              Abrir Documento
            </button>
          </>
        )}
      </div>
    </div>
  )
}
