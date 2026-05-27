'use client'

import { useState } from 'react'
import {
  Shield, UserPlus, CheckCircle2, AlertCircle,
  Loader2, Copy, QrCode, Lock
} from 'lucide-react'

type Step = 'auth' | 'form' | 'success'

interface PatientResult {
  token: string
  patientId: string
  firstName: string
  lastName: string
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('auth')
  const [accessKey, setAccessKey] = useState('')
  const [authError, setAuthError] = useState('')

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [implantDate, setImplantDate] = useState('')
  const [model, setModel] = useState('Titan OTR')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PatientResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessKey.trim()) { setAuthError('Ingresa la clave de acceso'); return }
    if (accessKey !== 'Titan2026') { setAuthError('Clave de acceso incorrecta'); return }
    setStep('form')
    setAuthError('')
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('Nombre y apellido son requeridos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessKey,
          firstName,
          lastName,
          implantDate: implantDate || null,
          model,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          setStep('auth')
          setAuthError('Clave de acceso incorrecta')
          return
        }
        throw new Error(data.error ?? 'Error al registrar')
      }

      setResult({ token: data.token, patientId: data.patientId, firstName, lastName })
      setStep('success')
    } catch (err: any) {
      setError(err.message ?? 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  const portalUrl = result
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/p/${result.token}`
    : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNewPatient = () => {
    setFirstName('')
    setLastName('')
    setImplantDate('')
    setModel('Titan OTR')
    setError('')
    setResult(null)
    setStep('form')
  }

  return (
    <div className="min-h-dvh bg-navy-900 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-[10px] bg-brand-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-serif text-white text-[18px]">TitanCare</span>
        </div>

        {/* ── Paso 1: Clave de acceso ── */}
        {step === 'auth' && (
          <div className="bg-white/[0.05] border border-white/10 rounded-[24px] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-[10px] bg-brand-600/15 flex items-center justify-center">
                <Lock className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-white font-medium text-[15px]">Acceso médico</p>
                <p className="text-slate-500 text-[11px]">Ingresa la clave para continuar</p>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Clave de acceso</label>
                <input
                  type="password"
                  value={accessKey}
                  onChange={e => { setAccessKey(e.target.value); setAuthError('') }}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-white text-[14px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-[12px] text-red-300">{authError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] py-3.5 font-medium text-[14px] transition-colors"
              >
                Continuar
              </button>
            </form>
          </div>
        )}

        {/* ── Paso 2: Formulario de registro ── */}
        {step === 'form' && (
          <div className="bg-white/[0.05] border border-white/10 rounded-[24px] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-[10px] bg-brand-600/15 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-white font-medium text-[15px]">Nuevo paciente</p>
                <p className="text-slate-500 text-[11px]">Completa los datos del paciente</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Nombre *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => { setFirstName(e.target.value); setError('') }}
                  placeholder="Juan"
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Apellido *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => { setLastName(e.target.value); setError('') }}
                  placeholder="Garcia"
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] placeholder-slate-600 focus:outline-none focus:border-brand-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Fecha de implante</label>
                <input
                  type="date"
                  value={implantDate}
                  onChange={e => setImplantDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-brand-600 transition-colors"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] mb-1 block">Modelo del implante</label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="w-full bg-navy-800 border border-white/10 rounded-[10px] px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-brand-600 transition-colors"
                >
                  <option value="Titan OTR">Titan OTR</option>
                  <option value="Titan Touch">Titan Touch</option>
                  <option value="Titan NB">Titan NB</option>
                </select>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-[10px] px-3 py-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-[12px] text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-[12px] py-3.5 flex items-center justify-center gap-2 font-medium text-[14px] transition-colors mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {loading ? 'Registrando...' : 'Registrar paciente'}
              </button>
            </form>
          </div>
        )}

        {/* ── Paso 3: Éxito ── */}
        {step === 'success' && result && (
          <div className="bg-white/[0.05] border border-white/10 rounded-[24px] p-6">
            <div className="flex flex-col items-center mb-5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-white font-medium text-[16px]">Paciente registrado</p>
              <p className="text-slate-400 text-[13px] mt-1">
                {result.firstName} {result.lastName}
              </p>
            </div>

            {/* Token */}
            <div className="bg-white/5 border border-white/10 rounded-[12px] p-4 mb-4">
              <p className="text-slate-400 text-[10px] uppercase tracking-wide mb-2">Token del paciente</p>
              <p className="text-white font-mono text-[18px] font-semibold text-center tracking-widest mb-3">
                {result.token}
              </p>
              <p className="text-slate-500 text-[10px] text-center mb-3">
                Programa este token en la tarjeta NFC o usa el enlace de abajo
              </p>

              {/* URL del portal */}
              <div className="bg-navy-800 rounded-[8px] p-3 flex items-center gap-2">
                <p className="text-slate-300 text-[11px] flex-1 break-all font-mono">{portalUrl}</p>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center"
                >
                  {copied
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : <Copy className="w-4 h-4 text-brand-400" />
                  }
                </button>
              </div>
            </div>

            {/* Instrucciones NFC */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3 mb-4">
              <p className="text-[11px] text-amber-300 leading-relaxed">
                <strong>Para programar la tarjeta NFC:</strong> usa la app NFC Tools, crea un registro tipo URI con la URL del portal y escribe en el chip NTAG215.
              </p>
            </div>

            <button
              onClick={handleNewPatient}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] py-3.5 flex items-center justify-center gap-2 font-medium text-[14px] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Registrar otro paciente
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
