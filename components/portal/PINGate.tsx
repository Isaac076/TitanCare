'use client'

import { useState, useRef, useEffect } from 'react'
import { useApiFetch } from '@/lib/token-context'
import { X, Lock, AlertCircle } from 'lucide-react'

interface Props {
  patientId: string
  onSuccess: () => void
  onClose: () => void
}

export function PINGate({ patientId, onSuccess, onClose }: Props) {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value.slice(-1) // Only last digit
    setPin(newPin)
    setError('')

    // Auto-advance
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3 && newPin.every((d) => d !== '')) {
      submitPin(newPin.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const apiFetch = useApiFetch()

  const submitPin = async (pinValue: string) => {
    if (loading || attempts >= 5) return
    setLoading(true)

    try {
      const res = await apiFetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, pin: pinValue }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setPin(['', '', '', ''])
        inputRefs.current[0]?.focus()

        if (newAttempts >= 5) {
          setError('Too many attempts. Please contact your physician.')
        } else {
          setError(`Incorrect PIN. ${5 - newAttempts} attempts remaining.`)
        }
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-navy-900 border border-white/10 rounded-[24px] p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-violet-500/15 flex items-center justify-center">
              <Lock className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-medium text-[14px]">Implant Details</p>
              <p className="text-slate-500 text-[11px]">Enter your 4-digit PIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* PIN inputs */}
        <div className="flex gap-3 justify-center mb-4">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el
              }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading || attempts >= 5}
              className={`pin-input ${error ? 'error' : ''}`}
              aria-label={`PIN digit ${i + 1}`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-[12px] text-red-300">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <p className="text-center text-[12px] text-slate-400 animate-pulse">
            Verifying...
          </p>
        )}

        <p className="text-center text-[11px] text-slate-600 mt-4">
          PIN provided by your physician at time of surgery
        </p>
      </div>
    </div>
  )
}
