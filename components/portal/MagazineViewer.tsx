'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLang } from '@/lib/lang-context'
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  signedUrl: string
  onClose: () => void
}

interface PageData {
  canvas: HTMLCanvasElement
  pageNum: number
}

export function MagazineViewer({ signedUrl, onClose }: Props) {
  const { lang } = useLang()
  const [pages, setPages] = useState<PageData[]>([])
  const [currentPage, setCurrentPage] = useState(0) // index of LEFT page
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState('')
  const [flipping, setFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right')
  const [zoom, setZoom] = useState(1)

  // Swipe
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cargar PDF con PDF.js
  useEffect(() => {
    loadPDF()
  }, [signedUrl])

  const loadPDF = async () => {
    try {
      // Cargar PDF.js dinámicamente
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

      const pdf = await pdfjsLib.getDocument({ url: signedUrl }).promise
      const total = pdf.numPages
      setTotalPages(total)

      const renderedPages: PageData[] = []

      // Renderizar todas las páginas
      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1.8 })

        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height

        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport, canvas }).promise

        renderedPages.push({ canvas, pageNum: i })
        setLoadingProgress(Math.round((i / total) * 100))
      }

      setPages(renderedPages)
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
    setTimeout(() => {
      setCurrentPage(p => p + 2)
      setFlipping(false)
    }, 400)
  }, [canGoNext, flipping])

  const goPrev = useCallback(() => {
    if (!canGoPrev || flipping) return
    setFlipDirection('right')
    setFlipping(true)
    setTimeout(() => {
      setCurrentPage(p => Math.max(0, p - 2))
      setFlipping(false)
    }, 400)
  }, [canGoPrev, flipping])

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) goNext()
      else goPrev()
    }
  }

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, onClose])

  const leftPage = pages[currentPage]
  const rightPage = pages[currentPage + 1]
  const spreadLabel = `${currentPage + 1}${rightPage ? `–${currentPage + 2}` : ''} / ${totalPages}`

  return (
    <div className="fixed inset-0 z-50 bg-[#1a0a00] flex flex-col items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#00B3D1] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
          <span className="text-white text-[13px] font-medium opacity-80">
            {lang === 'en' ? 'Post-Op Instructions' : 'Instrucciones Post-Op'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ml-1">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#00B3D1] animate-spin" />
          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00B3D1] rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-slate-400 text-[12px]">
            {lang === 'en' ? `Loading ${loadingProgress}%...` : `Cargando ${loadingProgress}%...`}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-red-300 text-[13px]">{error}</p>
        </div>
      )}

      {/* Magazine spread */}
      {!loading && !error && pages.length > 0 && (
        <div
          ref={containerRef}
          className="relative flex items-center justify-center w-full h-full px-12"
          style={{ perspective: '2000px' }}
        >
          {/* Prev button */}
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="absolute left-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          {/* Book spread */}
          <div
            className="relative flex items-center justify-center"
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease',
              transformOrigin: 'center center',
            }}
          >
            {/* Shadow bajo el libro */}
            <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/50 blur-xl rounded-full" />

            {/* Página izquierda */}
            <div
              className="relative overflow-hidden rounded-l-sm"
              style={{
                boxShadow: 'inset -4px 0 8px rgba(0,0,0,0.3)',
                transformOrigin: 'right center',
                animation: flipping && flipDirection === 'right'
                  ? 'flipInLeft 0.4s ease-in-out'
                  : flipping && flipDirection === 'left'
                  ? 'flipOutLeft 0.4s ease-in-out'
                  : 'none',
              }}
            >
              {leftPage ? (
                <canvas
                  ref={el => { if (el && leftPage.canvas) { el.width = leftPage.canvas.width; el.height = leftPage.canvas.height; el.getContext('2d')?.drawImage(leftPage.canvas, 0, 0) } }}
                  style={{ display: 'block', maxHeight: 'calc(100vh - 120px)', maxWidth: 'calc(50vw - 48px)', width: 'auto', height: 'auto' }}
                />
              ) : (
                <div className="w-48 h-64 bg-[#f5f0e8]" />
              )}
              {/* Sombra interior izquierda */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, transparent 30%)' }}
              />
            </div>

            {/* Lomo del libro */}
            <div style={{
              width: '6px',
              alignSelf: 'stretch',
              background: 'linear-gradient(to right, #8B7355, #D4C4A0, #8B7355)',
              boxShadow: '0 0 8px rgba(0,0,0,0.5)',
              flexShrink: 0,
            }} />

            {/* Página derecha */}
            <div
              className="relative overflow-hidden rounded-r-sm"
              style={{
                boxShadow: 'inset 4px 0 8px rgba(0,0,0,0.3)',
                transformOrigin: 'left center',
                animation: flipping && flipDirection === 'left'
                  ? 'flipInRight 0.4s ease-in-out'
                  : flipping && flipDirection === 'right'
                  ? 'flipOutRight 0.4s ease-in-out'
                  : 'none',
              }}
            >
              {rightPage ? (
                <canvas
                  ref={el => { if (el && rightPage.canvas) { el.width = rightPage.canvas.width; el.height = rightPage.canvas.height; el.getContext('2d')?.drawImage(rightPage.canvas, 0, 0) } }}
                  style={{ display: 'block', maxHeight: 'calc(100vh - 120px)', maxWidth: 'calc(50vw - 48px)', width: 'auto', height: 'auto' }}
                />
              ) : (
                <div style={{ width: leftPage?.canvas.width, height: leftPage?.canvas.height, maxHeight: 'calc(100vh - 120px)', maxWidth: 'calc(50vw - 48px)', background: '#f5f0e8' }} />
              )}
              {/* Sombra interior derecha */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.15) 0%, transparent 30%)' }}
              />
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="absolute right-2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center transition-all"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Footer */}
      {!loading && !error && (
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
          <p className="text-slate-500 text-[11px] font-mono">{spreadLabel}</p>
          <p className="text-slate-600 text-[10px]">
            {lang === 'en' ? '← swipe →' : '← desliza →'}
          </p>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes flipOutLeft {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(-25deg); opacity: 0.7; }
        }
        @keyframes flipInLeft {
          0%   { transform: rotateY(-25deg); opacity: 0.7; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
        @keyframes flipOutRight {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(25deg); opacity: 0.7; }
        }
        @keyframes flipInRight {
          0%   { transform: rotateY(25deg); opacity: 0.7; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
