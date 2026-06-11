'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '@/lib/lang-context'
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  signedUrl: string
  onClose: () => void
}

interface PageImg {
  src: string
  width: number
  height: number
}

const PDFJS_VERSION = '3.11.174'
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`
const WORKER_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

export function MagazineViewer({ signedUrl, onClose }: Props) {
  const { lang } = useLang()
  const [pages, setPages] = useState<PageImg[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [sliding, setSliding] = useState(false)
  const [slideDir, setSlideDir] = useState<'l' | 'r'>('l')
  const [zoom, setZoom] = useState(1)
  const touchX = useRef(0)

  useEffect(() => { loadPDF() }, [signedUrl])

  const loadPDF = async () => {
    try {
      await loadScript(PDFJS_CDN)
      const pdfjsLib = (window as any).pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN

      const pdf = await pdfjsLib.getDocument({ url: signedUrl }).promise
      const total = pdf.numPages
      setTotalPages(total)

      const imgs: PageImg[] = []
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement('canvas')
        canvas.width = vp.width
        canvas.height = vp.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        imgs.push({ src: canvas.toDataURL('image/jpeg', 0.85), width: vp.width, height: vp.height })
        setProgress(Math.round((i / total) * 100))
      }

      setPages(imgs)
      setLoading(false)
    } catch (err) {
      console.error('PDF error:', err)
      setError(lang === 'en' ? 'Could not load document.' : 'No se pudo cargar el documento.')
      setLoading(false)
    }
  }

  const canNext = currentPage < totalPages - 1
  const canPrev = currentPage > 0

  const goNext = useCallback(() => {
    if (!canNext || sliding) return
    setSlideDir('l')
    setSliding(true)
    setTimeout(() => { setCurrentPage(p => p + 1); setSliding(false) }, 300)
  }, [canNext, sliding])

  const goPrev = useCallback(() => {
    if (!canPrev || sliding) return
    setSlideDir('r')
    setSliding(true)
    setTimeout(() => { setCurrentPage(p => p - 1); setSliding(false) }, 300)
  }, [canPrev, sliding])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [goNext, goPrev, onClose])

  const page = pages[currentPage]
  const label = `${currentPage + 1} / ${totalPages}`

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 100%)' }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev() }
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" fill="#00B3D1"/>
            <clipPath id="mv"><circle cx="50" cy="50" r="44"/></clipPath>
            <g clipPath="url(#mv)" fill="#0B2D5E">
              <path d="M6 54 Q50 48 94 54 L94 106 Q50 106 6 106 Z"/>
              <path d="M8 50 Q30 44 50 47 Q70 50 92 44 L92 48 Q70 54 50 51 Q30 48 8 54 Z"/>
              <path d="M10 40 Q30 34 50 37 Q70 40 90 34 L90 38 Q70 44 50 41 Q30 38 10 44 Z"/>
              <path d="M12 30 Q32 24 50 27 Q68 30 88 24 L88 28 Q68 34 50 31 Q32 28 12 34 Z"/>
              <path d="M18 20 Q36 15 50 18 Q64 21 82 15 L82 19 Q64 25 50 22 Q36 19 18 25 Z"/>
            </g>
          </svg>
          <span className="text-white text-[13px] font-medium" style={{ opacity: .85 }}>
            {lang === 'en' ? 'Post-Op Instructions' : 'Instrucciones Post-Op'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.min(2.5, +(z + .25).toFixed(2)))}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.1)' }}>
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setZoom(z => Math.max(.5, +(z - .25).toFixed(2)))}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,.1)' }}>
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center ml-1" style={{ background: 'rgba(255,255,255,.1)' }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00B3D1' }} />
          <div className="w-52 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.1)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: '#00B3D1' }} />
          </div>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.4)' }}>
            {lang === 'en' ? `Loading ${progress}%` : `Cargando ${progress}%`}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] px-4 py-3"
          style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)' }}>
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-300 text-[13px]">{error}</p>
        </div>
      )}

      {/* Single page viewer */}
      {!loading && !error && pages.length > 0 && (
        <div className="relative flex items-center justify-center w-full h-full px-12">

          {/* Prev button */}
          <button onClick={goPrev} disabled={!canPrev}
            className="absolute left-2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: canPrev ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.04)' }}>
            <ChevronLeft className="w-5 h-5 text-white" style={{ opacity: canPrev ? 1 : .2 }} />
          </button>

          {/* Page container */}
          <div style={{
            transform: `scale(${zoom})`,
            transition: 'transform .2s ease',
            transformOrigin: 'center',
            position: 'relative',
          }}>
            {/* Sombra */}
            <div style={{
              position: 'absolute', bottom: -12, left: '8%', right: '8%',
              height: 20, background: 'rgba(0,0,0,.6)', filter: 'blur(12px)', borderRadius: '50%'
            }} />

            {/* Página */}
            <div style={{
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,.6), 0 2px 8px rgba(0,0,0,.4)',
              animation: sliding ? (slideDir === 'l' ? 'slideInFromRight .3s ease' : 'slideInFromLeft .3s ease') : 'none',
            }}>
              {page && (
                <img
                  src={page.src}
                  alt={`Página ${currentPage + 1}`}
                  style={{
                    display: 'block',
                    maxHeight: 'calc(100vh - 130px)',
                    maxWidth: 'calc(100vw - 96px)',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              )}
            </div>
          </div>

          {/* Next button */}
          <button onClick={goNext} disabled={!canNext}
            className="absolute right-2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: canNext ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.04)' }}>
            <ChevronRight className="w-5 h-5 text-white" style={{ opacity: canNext ? 1 : .2 }} />
          </button>
        </div>
      )}

      {/* Footer */}
      {!loading && !error && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
          {/* Dots indicator */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const idx = totalPages <= 7 ? i : Math.floor(i * (totalPages / 7))
              const isActive = totalPages <= 7 ? i === currentPage : (currentPage >= idx && currentPage < idx + Math.ceil(totalPages / 7))
              return (
                <div key={i} style={{
                  width: isActive ? 16 : 4,
                  height: 4,
                  borderRadius: 2,
                  background: isActive ? '#00B3D1' : 'rgba(255,255,255,.2)',
                  transition: 'all .2s ease',
                }} />
              )
            })}
          </div>
          <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 11, fontFamily: 'monospace' }}>{label}</span>
        </div>
      )}

      <style>{`
        @keyframes slideInFromRight {
          0%   { transform: translateX(60px); opacity: 0; }
          100% { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInFromLeft {
          0%   { transform: translateX(-60px); opacity: 0; }
          100% { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
    </div>
  )
}
