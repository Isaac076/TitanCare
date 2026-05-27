'use client'

import { useState } from 'react'
import {
  Activity, Plane, ClipboardList, BadgeInfo,
  Phone, HelpCircle, ChevronRight, Shield,
  CheckCircle2, Pencil, Lock, User,
} from 'lucide-react'
import type { PatientPortalData, DocType } from '@/lib/types'
import { PINGate } from './PINGate'
import { DocumentViewer } from './DocumentViewer'
import { PhysicianContact } from './PhysicianContact'
import { SetPIN } from './SetPIN'
import { EditProfile } from './EditProfile'
import { ImplantDetails } from './ImplantDetails'

interface Props {
  data: PatientPortalData
  patientId: string
}

const DOC_META: Record<DocType, { label: string; sub: string; icon: React.ElementType; iconBg: string; iconColor: string }> = {
  mri:           { label: 'Compatibilidad MRI',       sub: 'Condiciones e información de seguridad', icon: Activity,      iconBg: 'bg-blue-50',   iconColor: 'text-blue-600' },
  airport:       { label: 'Carta para Aeropuerto',     sub: 'Carta de notificación de viaje',         icon: Plane,         iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  postop:        { label: 'Instrucciones Post-Op',     sub: 'Guía de recuperación',                   icon: ClipboardList, iconBg: 'bg-amber-50',  iconColor: 'text-amber-600' },
  implant_sheet: { label: 'Detalles del Implante',     sub: 'Serial, lote y especificaciones',        icon: BadgeInfo,     iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  faq:           { label: 'Preguntas Frecuentes',      sub: 'Preguntas y respuestas comunes',         icon: HelpCircle,    iconBg: 'bg-rose-50',   iconColor: 'text-rose-600' },
}

const PUBLIC_DOC_ORDER: DocType[] = ['mri', 'airport', 'postop', 'faq']

export function PatientPortal({ data, patientId }: Props) {
  const [pinUnlocked, setPinUnlocked] = useState(false)
  const [showPinGate, setShowPinGate] = useState(false)
  const [showSetPin, setShowSetPin] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showImplantDetails, setShowImplantDetails] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<DocType | null>(null)
  const [showPhysician, setShowPhysician] = useState(false)
  const [pinIsSet, setPinIsSet] = useState(data.pinIsSet)
  const [displayName, setDisplayName] = useState(
    data.patient.display_name ?? `${data.patient.first_name} ${data.patient.last_name}`
  )
  const [photoUrl, setPhotoUrl] = useState<string | null>(data.patient.photo_url ?? null)

  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const implantDateFormatted = data.implant?.implant_date
    ? new Intl.DateTimeFormat('es-MX', { month: 'long', day: 'numeric', year: 'numeric' }).format(
        new Date(data.implant.implant_date)
      )
    : null

  // Tocar "Consultar información de implante"
  const handleImplantTap = () => {
    if (!pinIsSet) {
      // Sin PIN → crear primero
      setShowSetPin(true)
    } else if (!pinUnlocked) {
      // Tiene PIN pero no ha entrado → pedir PIN
      setShowPinGate(true)
    } else {
      // Ya desbloqueado → abrir directo
      setShowImplantDetails(true)
    }
  }

  const handlePinSuccess = () => {
    setPinUnlocked(true)
    setShowPinGate(false)
    setShowImplantDetails(true)
  }

  const handleSetPinSuccess = () => {
    setPinIsSet(true)
    setShowSetPin(false)
    // Después de crear PIN entra directo, no pide el PIN de nuevo
    setShowImplantDetails(true)
  }

  // Cambiar PIN desde dentro de ImplantDetails
  const handleChangePinFromDetails = () => {
    setShowImplantDetails(false)
    setShowSetPin(true)
  }

  const handleSetPinChange = () => {
    setPinIsSet(true)
    setShowSetPin(false)
    // Después de cambiar PIN vuelve a los detalles
    setShowImplantDetails(true)
  }

  return (
    <>
      <div className="min-h-dvh bg-[#F7F8FA] flex flex-col max-w-md mx-auto">

        {/* ── Header ─────────────────────────────────── */}
        <div className="bg-navy-900 rounded-b-[28px] px-5 pt-12 pb-6 safe-top">
          <div className="flex justify-between items-start mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-[8px] bg-brand-600 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-serif text-white text-[16px] tracking-wide">TitanCare</span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase pl-[36px]">
                Coloplast Titan · Portal del Paciente
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
              <span className="text-[10px] text-blue-300 font-medium tracking-wide">Verificado</span>
            </div>
          </div>

          {/* Tarjeta del paciente */}
          <button
            onClick={() => setShowEditProfile(true)}
            className="w-full bg-white/[0.06] border border-white/10 rounded-[16px] p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-all"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-brand-600 to-sky-400 flex items-center justify-center text-white font-semibold text-[15px] flex-shrink-0">
              {photoUrl
                ? <img src={photoUrl} alt="Foto" className="w-full h-full object-cover" />
                : initials
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-[14px] leading-tight">{displayName}</p>
              <p className="text-slate-500 text-[11px] mt-0.5 truncate">
                {implantDateFormatted ? `Implante: ${implantDateFormatted}` : data.implant?.model ?? 'Titan Prosthesis'}
              </p>
            </div>
            <Pencil className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          </button>
        </div>

        {/* ── Documentos ─────────────────────────────── */}
        <div className="flex-1 px-4 py-5 flex flex-col gap-2.5">

          <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400 px-1 mb-0.5">
            Documentos médicos
          </p>

          {/* Documentos globales */}
          {PUBLIC_DOC_ORDER.map((docType, i) => {
            const meta = DOC_META[docType]
            const Icon = meta.icon
            return (
              <button
                key={docType}
                onClick={() => setViewingDoc(docType)}
                className={`card-enter-${i} w-full bg-white border border-slate-200 rounded-[14px] p-4 flex items-center gap-3 text-left transition-all active:scale-[0.98] hover:bg-slate-50/80`}
              >
                <div className={`w-10 h-10 rounded-[10px] ${meta.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-[18px] h-[18px] ${meta.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-800">{meta.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{meta.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </button>
            )
          })}

          {/* Botón implante — cambia según estado */}
          {data.privateDocsAvailable && (
            <button
              onClick={handleImplantTap}
              className="card-enter-4 w-full bg-white border border-violet-200 rounded-[14px] p-4 flex items-center gap-3 text-left transition-all active:scale-[0.98] hover:bg-violet-50/50"
            >
              <div className="w-10 h-10 rounded-[10px] bg-violet-50 flex items-center justify-center flex-shrink-0">
                <BadgeInfo className="w-[18px] h-[18px] text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-medium text-slate-800">
                    {!pinIsSet ? 'Crear PIN de seguridad' : 'Consultar información de implante'}
                  </p>
                  {pinIsSet && !pinUnlocked && (
                    <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">
                      PIN
                    </span>
                  )}
                  {pinUnlocked && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                      Desbloqueado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {!pinIsSet ? 'Configura un PIN para proteger tus datos' : 'Lotes, foto y detalles del dispositivo'}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </button>
          )}

          {/* Soporte */}
          <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400 px-1 mt-1.5 mb-0.5">
            Soporte
          </p>

          <button
            onClick={() => setShowPhysician(true)}
            className="card-enter-5 w-full bg-gradient-to-br from-navy-800 to-navy-700 rounded-[14px] p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-white">Contactar Médico</p>
              <p className="text-[11px] text-blue-300 mt-0.5">
                {data.physician?.full_name ?? 'Tu equipo médico'} · Lun–Vie
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
          </button>

          {/* Disclaimer */}
          <div className="mt-1 bg-slate-100 rounded-[10px] p-3 flex gap-2 items-start">
            <Shield className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Esta información no reemplaza el consejo médico de su médico.
              En caso de emergencia, contacte a su médico o llame al 911 inmediatamente.
            </p>
          </div>

          <div className="safe-bottom h-6" />
        </div>
      </div>

      {/* ── Overlays ─────────────────────────────────── */}
      {showPinGate && (
        <PINGate
          patientId={patientId}
          onSuccess={handlePinSuccess}
          onClose={() => setShowPinGate(false)}
        />
      )}
      {showSetPin && (
        <SetPIN
          patientId={patientId}
          hasExistingPin={pinIsSet}
          onSuccess={pinIsSet ? handleSetPinChange : handleSetPinSuccess}
          onClose={() => setShowSetPin(false)}
        />
      )}
      {showEditProfile && (
        <EditProfile
          patientId={patientId}
          currentName={displayName}
          currentPhoto={photoUrl}
          onSuccess={(name, photo) => {
            setDisplayName(name)
            setPhotoUrl(photo)
            setShowEditProfile(false)
          }}
          onClose={() => setShowEditProfile(false)}
        />
      )}
      {showImplantDetails && (
        <ImplantDetails
          patientId={patientId}
          onChangePin={handleChangePinFromDetails}
          onClose={() => setShowImplantDetails(false)}
        />
      )}
      {viewingDoc && (
        <DocumentViewer
          docType={viewingDoc}
          patientId={patientId}
          isGlobal={viewingDoc !== 'implant_sheet'}
          onClose={() => setViewingDoc(null)}
        />
      )}
      {showPhysician && (
        <PhysicianContact
          patientId={patientId}
          onClose={() => setShowPhysician(false)}
        />
      )}
    </>
  )
}
