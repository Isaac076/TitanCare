'use client'

import { useState, useRef, useEffect } from 'react'
import { useApiFetch } from '@/lib/token-context'
import { X, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface Props {
  patientId: string
  hasExistingPin: boolean
  onSuccess: () => void
  onClose: () => void
}

export function SetPIN({ patientId, hasExistingPin, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>(!hasExistingPin ? 'new' : 'current')
  const [currentPin, setCurrentPin] = useState(['', '', '', ''])
  const [newPin, setNewPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [step])

  const activePin = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin
  const setActivePin = step === 'current' ? setCurrentPin : step === 'new' ? setNewPin : setConfirmPin

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...activePin]
    next[index] = value.slice(-1)
    setActivePin(next)
    setError('')

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (value && index === 3 && next.every(d => d !== '')) {
      handleStepComplete(next.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !activePin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleStepComplete = (value: string) => {
    if (step === 'current') {
      setStep('new')
    } else if (step === 'new') {
      setStep('confirm')
    } else {
      // Confirmar que los PINs coinciden
      const newValue = newPin.join('')
      if (value !== newValue) {
        setError('Los PINs no coinciden. Intenta de nuevo.')
        setConfirmPin(['', '', '', ''])
        setNewPin(['', '', '', ''])
        setStep('new')
        return
      }
      submitPin(newValue)
    }
  }

  const apiFetch = useApiFetch()

  const submitPin = async (pin: string) => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/patient/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          currentPin: hasExistingPin ? currentPin.join('') : undefined,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(onSuccess, 1500)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Error al guardar el PIN')
        setStep(!hasExistingPin ? 'new' : 'current')
        setCurrentPin(['', '', '', ''])
        setNewPin(['', '', '', ''])
        setConfirmPin(['', '', '', ''])
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = {
    current: { title: 'PIN actual',    sub: 'Ingresa tu PIN actual para continuar' },
    new:     { title: 'Nuevo PIN',     sub: 'Elige un PIN de 4 dígitos' },
    confirm: { title: 'Confirmar PIN', sub: 'Ingresa el nuevo PIN otra vez' },
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-navy-900 border border-white/10 rounded-[24px] p-6">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-violet-500/15 flex items-center justify-center">
              <Lock className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-medium text-[14px]">
                {hasExistingPin ? 'Cambiar PIN' : 'Crear PIN'}
              </p>
              <p className="text-slate-500 text-[11px]">{stepLabels[step].sub}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Indicador de pasos */}
        {hasExistingPin && (
          <div className="flex gap-2 mb-5">
            {(['current', 'new', 'confirm'] as const).map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${
                step === s ? 'bg-violet-500' :
                (['current', 'new', 'confirm'].indexOf(step) > i) ? 'bg-violet-500/40' : 'bg-white/10'
              }`} />
            ))}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white font-medium">¡PIN guardado!</p>
          </div>
        ) : (
          <>
            <p className="text-center text-white font-medium text-[15px] mb-4">
              {stepLabels[step].title}
            </p>

            <div className="flex gap-3 justify-center mb-4">
              {activePin.map((digit, i) => (
                <input
                  key={i}
                  ref={el => {
                    inputRefs.current[i] = el
                  }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading}
                  className={`pin-input ${error ? 'error' : ''}`}
                  aria-label={`Dígito ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            {loading && (
              <p className="text-center text-[12px] text-slate-400 animate-pulse">Guardando...</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
