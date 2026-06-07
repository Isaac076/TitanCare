'use client'

import { useState } from 'react'
import {
  Activity, Plane, ClipboardList, BadgeInfo,
  Phone, HelpCircle, ChevronRight, Shield,
  Pencil,
} from 'lucide-react'

// Logo Coloplast: círculo aqua con franjas onduladas azul marino
function ColoplastLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#00B3D1"/>
      <clipPath id="cc">
        <circle cx="50" cy="50" r="44"/>
      </clipPath>
      <g clipPath="url(#cc)" fill="#0B2D5E">
        <path d="M6 54 Q50 48 94 54 L94 106 Q50 106 6 106 Z"/>
        <path d="M8 50 Q30 44 50 47 Q70 50 92 44 L92 48 Q70 54 50 51 Q30 48 8 54 Z"/>
        <path d="M10 40 Q30 34 50 37 Q70 40 90 34 L90 38 Q70 44 50 41 Q30 38 10 44 Z"/>
        <path d="M12 30 Q32 24 50 27 Q68 30 88 24 L88 28 Q68 34 50 31 Q32 28 12 34 Z"/>
        <path d="M18 20 Q36 15 50 18 Q64 21 82 15 L82 19 Q64 25 50 22 Q36 19 18 25 Z"/>
        <path d="M28 11 Q40 7 50 9 Q60 11 72 7 L72 11 Q60 15 50 13 Q40 11 28 15 Z"/>
      </g>
    </svg>
  )
}
import type { PatientPortalData, DocType } from '@/lib/types'
import { PINGate } from './PINGate'
import { DocumentViewer } from './DocumentViewer'
import { PhysicianContact } from './PhysicianContact'
import { SetPIN } from './SetPIN'
import { EditProfile } from './EditProfile'
import { ImplantDetails } from './ImplantDetails'
import { useLang } from '@/lib/lang-context'

interface Props {
  data: PatientPortalData
  patientId: string
}

export function PatientPortal({ data, patientId }: Props) {
  const { lang, setLang, t } = useLang()

  const [pinUnlocked, setPinUnlocked] = useState(false)
  const [showPinGate, setShowPinGate] = useState(false)
  const [showSetPin, setShowSetPin] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showImplantDetails, setShowImplantDetails] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<DocType | null>(null)
  const [showPhysician, setShowPhysician] = useState(false)
  const [pinIsSet, setPinIsSet] = useState(data.pinIsSet)
  const [displayName, setDisplayName] = useState<string>(
    typeof data.patient.display_name === 'string'
      ? data.patient.display_name
      : `${data.patient.first_name} ${data.patient.last_name}`
  )
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    typeof data.patient.photo_url === 'string' ? data.patient.photo_url : null
  )

  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const implantDateFormatted = data.implant?.implant_date
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-MX', {
        month: 'long', day: 'numeric', year: 'numeric',
      }).format(new Date(data.implant.implant_date))
    : null

  // Metadatos de documentos con traducciones
  const DOC_META = {
    mri:           { label: t('doc_mri_label'),     sub: t('doc_mri_sub'),     icon: Activity,      iconBg: 'bg-blue-50',   iconColor: 'text-blue-600' },
    airport:       { label: t('doc_airport_label'), sub: t('doc_airport_sub'), icon: Plane,         iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    postop:        { label: t('doc_postop_label'),  sub: t('doc_postop_sub'),  icon: ClipboardList, iconBg: 'bg-amber-50',  iconColor: 'text-amber-600' },
    implant_sheet: { label: t('doc_implant_label'), sub: t('doc_implant_sub'), icon: BadgeInfo,     iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    faq:           { label: t('doc_faq_label'),     sub: t('doc_faq_sub'),     icon: HelpCircle,    iconBg: 'bg-rose-50',   iconColor: 'text-rose-600' },
  }

  const PUBLIC_DOC_ORDER: DocType[] = ['mri', 'airport', 'postop', 'faq']

  const handleImplantTap = () => {
    if (!pinIsSet) {
      setShowSetPin(true)
    } else if (!pinUnlocked) {
      setShowPinGate(true)
    } else {
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
    setShowImplantDetails(true)
  }

  const handleChangePinFromDetails = () => {
    setShowImplantDetails(false)
    setShowSetPin(true)
  }

  const handleSetPinChange = () => {
    setPinIsSet(true)
    setShowSetPin(false)
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
                <ColoplastLogo size={28} />
                <span className="font-serif text-white text-[16px] tracking-wide">TitanCare</span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase pl-[36px]">
                {t('portal_subtitle')}
              </p>
            </div>

            {/* Lado derecho: badge verificado + botón idioma */}
            <div className="flex items-center gap-2">
              {/* Botón idioma */}
              <button
                onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
                className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2.5 py-1.5 hover:bg-white/10 transition-colors"
                title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              >
                <span className="text-[13px]">{lang === 'es' ? '🇺🇸' : '🇲🇽'}</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'es' ? 'EN' : 'ES'}
                </span>
              </button>

              {/* Badge verificado */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                <span className="text-[10px] text-blue-300 font-medium tracking-wide">
                  {t('portal_verified')}
                </span>
              </div>
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
                {implantDateFormatted
                  ? `${t('portal_implant_date')}: ${implantDateFormatted}`
                  : data.implant?.model ?? 'Titan Prosthesis'}
              </p>
            </div>
            <Pencil className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          </button>
        </div>

        {/* ── Documentos ─────────────────────────────── */}
        <div className="flex-1 px-4 py-5 flex flex-col gap-2.5">

          <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400 px-1 mb-0.5">
            {t('portal_medical_docs')}
          </p>

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

          {/* Botón implante */}
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
                    {!pinIsSet ? t('portal_create_pin') : t('portal_implant_info')}
                  </p>
                  {pinIsSet && !pinUnlocked && (
                    <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">
                      {t('portal_pin_badge')}
                    </span>
                  )}
                  {pinUnlocked && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                      {t('portal_unlocked')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {!pinIsSet ? t('portal_pin_protect') : t('portal_lots_detail')}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </button>
          )}

          {/* Soporte */}
          <p className="text-[10px] font-semibold tracking-[0.08em] uppercase text-slate-400 px-1 mt-1.5 mb-0.5">
            {t('portal_support')}
          </p>

          <button
            onClick={() => setShowPhysician(true)}
            className="card-enter-5 w-full bg-gradient-to-br from-navy-800 to-navy-700 rounded-[14px] p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-white">{t('portal_contact_doctor')}</p>
              <p className="text-[11px] text-blue-300 mt-0.5">
                {data.physician?.full_name ?? t('portal_your_team')} · {t('portal_mon_fri')}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
          </button>

          {/* Disclaimer */}
          <div className="mt-1 bg-slate-100 rounded-[10px] p-3 flex gap-2 items-start">
            <Shield className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {t('portal_disclaimer')}
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
