'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '@/lib/lang-context'
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  signedUrl: string
  onClose: () => void
}

interface PageData {
  dataUrl: string
  width: number
  height: number
}

export function MagazineViewer({ signedUrl, onClose }: Props) {
  const { lang } = useLang()
  const [pages, setPages] = useState<PageData[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState('')
  const [flipping, setFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('left')
  const [zoom, setZoom] = useState(1)
  const touchStartX = useRef<number>(0)

  useEffect(() => { loadPDF() }, [signedUrl])

  const loadPDF = async () => {
    try {
      // Importar pdfjs-dist y configurar worker como módulo
      const pdfjsLib = await import('pdfjs-dist')

      // Usar el worker bundleado con Next.js (evita CSP)
      const workerUrl = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      )
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString()

      const pdf = await pdfjsLib.getDocument({ url: signedUrl }).promise
      const total = pdf.numPages
      setTotalPages(total)

      const rendered: PageData[] = []

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.8 })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height

        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas }).promise

        rendered.push({
          dataUrl: canvas.toDataURL('image/jpeg', 0.85),
          width: viewport.width,
          height: viewport.height,
        })

        setLoadingProgress(Math.round((i / total) * 100))
      }

      setPages(rendered)
      setLoading(false)
    } catch (err) {
      console.error('PDF load error:', err)
      setError(lang === 'en' ? 'Could not load document.' : 'No se pudo cargar el documento.')
      setLoading(false)
    }
  }

  const canGoNext = currentPage + 2 < totalPages
  const canGoPrev = currentPage > 0

  const goNext = useCallback(() => {
    if (!canGoNext || flipping) return
    setFlipDirection('left')
    setFlipping(true)
    setTimeout(() => { setCurrentPage(p => p + 2); setFlipping(false) }, 380)
  }, [canGoNext, flipping])

  const goPrev = useCallback(() => {
    if (!canGoPrev || flipping) return
    setFlipDirection('right')
    setFlipping(true)
    setTimeout(() => { setCurrentPage(p => Math.max(0, p - 2)); setFlipping(false) }, 380)
  }, [canGoPrev, flipping])

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) { if (dx < 0) goNext(); else goPrev() }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, onClose])

  const leftPage  = pages[currentPage]
  const rightPage = pages[currentPage + 1]
  const spreadLabel = `${currentPage + 1}${rightPage ? `–${currentPage + 2}` : ''} / ${totalPages}`

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at center, #2a1a0a 0%, #0d0600 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="50" fill="#00B3D1"/>
              <clipPath id="mc"><circle cx="50" cy="50" r="44"/></clipPath>
              <g clipPath="url(#mc)" fill="#0B2D5E">
                <path d="M6 54 Q50 48 94 54 L94 106 Q50 106 6 106 Z"/>
                <path d="M8 50 Q30 44 50 47 Q70 50 92 44 L92 48 Q70 54 50 51 Q30 48 8 54 Z"/>
                <path d="M10 40 Q30 34 50 37 Q70 40 90 34 L90 38 Q70 44 50 41 Q30 38 10 44 Z"/>
                <path d="M12 30 Q32 24 50 27 Q68 30 88 24 L88 28 Q68 34 50 31 Q32 28 12 34 Z"/>
                <path d="M18 20 Q36 15 50 18 Q64 21 82 15 L82 19 Q64 25 50 22 Q36 19 18 25 Z"/>
              </g>
            </svg>
          </div>
          <span className="text-white text-[13px] font-medium" style={{ opacity: 0.85 }}>
            {lang === 'en' ? 'Post-Op Instructions' : 'Instrucciones Post-Op'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.min(2.5, +(z + 0.25).toFixed(2)))}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center ml-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#00B3D1' }} />
          <div className="w-52 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%`, background: '#00B3D1' }} />
          </div>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {lang === 'en' ? `Loading ${loadingProgress}%` : `Cargando ${loadingProgress}%`}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-[10px] px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-300 text-[13px]">{error}</p>
        </div>
      )}

      {/* Spread */}
      {!loading && !error && pages.length > 0 && (
        <div className="relative flex items-center justify-center w-full h-full px-14" style={{ perspective: '2400px' }}>

          {/* Prev */}
          <button onClick={goPrev} disabled={!canGoPrev}
            className="absolute left-2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: canGoPrev ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)' }}>
            <ChevronLeft className="w-5 h-5 text-white" style={{ opacity: canGoPrev ? 1 : 0.2 }} />
          </button>

          <div style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease', transformOrigin: 'center center', display: 'flex', alignItems: 'center', position: 'relative' }}>

            {/* Sombra */}
            <div style={{ position: 'absolute', bottom: '-12px', left: '6%', right: '6%', height: '20px', background: 'rgba(0,0,0,0.6)', filter: 'blur(12px)', borderRadius: '50%' }} />

            {/* Página izquierda */}
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: '2px 0 0 2px',
              boxShadow: 'inset -6px 0 12px rgba(0,0,0,0.35)',
              transformOrigin: 'right center',
              animation: flipping ? (flipDirection === 'right' ? 'flipInL 0.38s ease' : 'flipOutL 0.38s ease') : 'none',
            }}>
              {leftPage
                ? <img src={leftPage.dataUrl} alt="" style={{ display: 'block', maxHeight: 'calc(100vh - 130px)', maxWidth: 'calc(50vw - 56px)', width: 'auto', height: 'auto' }} />
                : <div style={{ width: 200, height: 280, background: '#f5f0e8' }} />
              }
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, transparent 25%)' }} />
            </div>

            {/* Lomo */}
            <div style={{ width: '7px', alignSelf: 'stretch', flexShrink: 0, background: 'linear-gradient(to right, #6b5230, #d4b483, #c8a96e, #d4b483, #6b5230)', boxShadow: '0 0 10px rgba(0,0,0,0.6)' }} />

            {/* Página derecha */}
            <div style={{
              position: 'relative', overflow: 'hidden', borderRadius: '0 2px 2px 0',
              boxShadow: 'inset 6px 0 12px rgba(0,0,0,0.35)',
              transformOrigin: 'left center',
              animation: flipping ? (flipDirection === 'left' ? 'flipInR 0.38s ease' : 'flipOutR 0.38s ease') : 'none',
            }}>
              {rightPage
                ? <img src={rightPage.dataUrl} alt="" style={{ display: 'block', maxHeight: 'calc(100vh - 130px)', maxWidth: 'calc(50vw - 56px)', width: 'auto', height: 'auto' }} />
                : <div style={{ width: leftPage?.width ?? 200, height: leftPage?.height ?? 280, maxHeight: 'calc(100vh - 130px)', maxWidth: 'calc(50vw - 56px)', background: '#f5f0e8' }} />
              }
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to left, rgba(0,0,0,0.18) 0%, transparent 25%)' }} />
            </div>
          </div>

          {/* Next */}
          <button onClick={goNext} disabled={!canGoNext}
            className="absolute right-2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: canGoNext ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)' }}>
            <ChevronRight className="w-5 h-5 text-white" style={{ opacity: canGoNext ? 1 : 0.2 }} />
          </button>
        </div>
      )}

      {/* Footer */}
      {!loading && !error && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}>{spreadLabel}</p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
            {lang === 'en' ? '← swipe →' : '← desliza →'}
          </p>
        </div>
      )}

      <style>{`
        @keyframes flipOutL { 0%{transform:rotateY(0)} 100%{transform:rotateY(-22deg);opacity:.65} }
        @keyframes flipInL  { 0%{transform:rotateY(-22deg);opacity:.65} 100%{transform:rotateY(0);opacity:1} }
        @keyframes flipOutR { 0%{transform:rotateY(0)} 100%{transform:rotateY(22deg);opacity:.65} }
        @keyframes flipInR  { 0%{transform:rotateY(22deg);opacity:.65} 100%{transform:rotateY(0);opacity:1} }
      `}</style>
    </div>
  )
}
