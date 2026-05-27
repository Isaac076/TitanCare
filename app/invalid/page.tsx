import { ShieldAlert, Phone } from 'lucide-react'

export default function InvalidPage() {
  return (
    <div className="min-h-dvh bg-navy-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <ShieldAlert className="w-7 h-7 text-red-400" />
      </div>

      <h1 className="text-white font-serif text-[22px] mb-2">Link Not Found</h1>
      <p className="text-slate-400 text-[14px] leading-relaxed max-w-xs mb-8">
        This link is invalid, expired, or has been deactivated.
        Please contact your physician for a new card or link.
      </p>

      <a
        href="tel:911"
        className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-white transition-colors"
      >
        <Phone className="w-3.5 h-3.5" />
        Emergency: call 911
      </a>
    </div>
  )
}
