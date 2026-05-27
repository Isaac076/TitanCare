'use client'

import { useState, useCallback } from 'react'
import {
  Users, FileUp, Activity, Key, LogOut,
  CheckCircle, AlertCircle, Upload, RefreshCw,
  Eye, EyeOff, ToggleLeft, ToggleRight
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
interface PatientRow {
  id: string
  full_name: string
  implant_date: string | null
  physician_name: string | null
  token: string
  card_active: boolean
  last_used: string | null
}

interface Tab { id: string; label: string; icon: React.ElementType }

const TABS: Tab[] = [
  { id: 'patients',  label: 'Patients',  icon: Users },
  { id: 'documents', label: 'Documents', icon: FileUp },
  { id: 'logs',      label: 'Access Logs', icon: Activity },
]

// ─── Admin layout ─────────────────────────────────────────────
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('patients')

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar */}
      <aside className="w-56 bg-navy-900 flex flex-col py-6 px-4 min-h-screen">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Key className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-white font-serif text-[14px]">TitanCare</p>
            <p className="text-slate-500 text-[9px] tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-left text-[13px] transition-colors ${
                activeTab === id
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <button className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-[12px] transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {activeTab === 'patients'  && <PatientsTab />}
        {activeTab === 'documents' && <DocumentsTab />}
        {activeTab === 'logs'      && <LogsTab />}
      </main>
    </div>
  )
}

// ─── Patients tab ─────────────────────────────────────────────
function PatientsTab() {
  // Demo data — replace with Supabase fetch in production
  const patients: PatientRow[] = [
    { id: '1', full_name: 'James Mitchell',   implant_date: '2024-03-14', physician_name: 'Dr. Sarah Kim',    token: 'ABCD-1234', card_active: true,  last_used: '2024-05-20' },
    { id: '2', full_name: 'Robert Sanchez',   implant_date: '2024-01-08', physician_name: 'Dr. Mark Patel',   token: 'WXYZ-5678', card_active: true,  last_used: '2024-05-18' },
    { id: '3', full_name: 'David Thompson',   implant_date: '2023-11-22', physician_name: 'Dr. Sarah Kim',    token: 'PQRS-9012', card_active: false, last_used: null },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-slate-800">Patients</h1>
          <p className="text-slate-400 text-[13px] mt-0.5">{patients.length} registered patients</p>
        </div>
        <button className="bg-brand-600 text-white px-4 py-2 rounded-[10px] text-[13px] font-medium hover:bg-brand-700 transition-colors flex items-center gap-2">
          <Upload className="w-4 h-4" />
          New Patient
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Patient</th>
              <th className="text-left px-4 py-3.5 text-slate-400 font-medium">Physician</th>
              <th className="text-left px-4 py-3.5 text-slate-400 font-medium">Implant Date</th>
              <th className="text-left px-4 py-3.5 text-slate-400 font-medium">Token</th>
              <th className="text-left px-4 py-3.5 text-slate-400 font-medium">Card</th>
              <th className="text-left px-4 py-3.5 text-slate-400 font-medium">Last Access</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-medium text-slate-800">{p.full_name}</td>
                <td className="px-4 py-3.5 text-slate-500">{p.physician_name ?? '—'}</td>
                <td className="px-4 py-3.5 text-slate-500">
                  {p.implant_date ? new Date(p.implant_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td className="px-4 py-3.5">
                  <code className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-mono">
                    {p.token}
                  </code>
                </td>
                <td className="px-4 py-3.5">
                  {p.card_active
                    ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> Active</span>
                    : <span className="flex items-center gap-1 text-slate-400"><AlertCircle className="w-3.5 h-3.5" /> Inactive</span>
                  }
                </td>
                <td className="px-4 py-3.5 text-slate-500">
                  {p.last_used ? new Date(p.last_used).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3.5">
                  <button className="text-slate-400 hover:text-brand-600 transition-colors">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Documents tab ────────────────────────────────────────────
function DocumentsTab() {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    // Handle file upload
  }, [])

  const docTypes = [
    { type: 'mri',           label: 'MRI Compatibility',      private: false, uploaded: true  },
    { type: 'airport',       label: 'Airport Medical Notice',  private: false, uploaded: true  },
    { type: 'postop',        label: 'Post-Op Instructions',    private: false, uploaded: true  },
    { type: 'implant_sheet', label: 'Implant Details',         private: true,  uploaded: false },
    { type: 'faq',           label: 'FAQ Document',            private: false, uploaded: true  },
  ]

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-slate-800 mb-1">Documents</h1>
      <p className="text-slate-400 text-[13px] mb-6">Manage patient documents and PDFs</p>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-[14px] p-8 text-center mb-6 transition-colors ${
          dragging ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300'
        }`}
      >
        <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500 text-[13px] font-medium">Drop PDF here or click to upload</p>
        <p className="text-slate-400 text-[11px] mt-1">PDF files only · Max 20MB</p>
      </div>

      {/* Doc type list */}
      <div className="space-y-2">
        {docTypes.map((doc) => (
          <div key={doc.type} className="bg-white border border-slate-200 rounded-[12px] px-4 py-3.5 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${doc.uploaded ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-slate-700">{doc.label}</p>
              <p className="text-[11px] text-slate-400">
                {doc.private ? '🔒 Private · PIN required' : 'Public · No PIN required'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {doc.uploaded
                ? <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">v1 uploaded</span>
                : <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Missing</span>
              }
              <button className="text-slate-400 hover:text-brand-600 transition-colors p-1">
                <Upload className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Access Logs tab ──────────────────────────────────────────
function LogsTab() {
  const logs = [
    { patient: 'James Mitchell', doc: 'mri',           time: '2024-05-20 14:32', masked_ip: 'a3f2...9c1e' },
    { patient: 'James Mitchell', doc: 'airport',       time: '2024-05-20 14:33', masked_ip: 'a3f2...9c1e' },
    { patient: 'Robert Sanchez', doc: 'portal_open',   time: '2024-05-18 09:11', masked_ip: 'b7d4...2a5f' },
    { patient: 'Robert Sanchez', doc: 'implant_sheet', time: '2024-05-18 09:12', masked_ip: 'b7d4...2a5f' },
  ]

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-slate-800 mb-1">Access Logs</h1>
      <p className="text-slate-400 text-[13px] mb-6">IP addresses are hashed for privacy compliance</p>

      <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Patient</th>
              <th className="text-left px-4 py-3.5 text-slate-400 font-medium">Document</th>
              <th className="text-left px-4 py-3.5 text-slate-400 font-medium">Time</th>
              <th className="text-left px-4 py-3.5 text-slate-400 font-medium">IP (hashed)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-5 py-3 text-slate-700">{log.patient}</td>
                <td className="px-4 py-3">
                  <code className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">
                    {log.doc}
                  </code>
                </td>
                <td className="px-4 py-3 text-slate-500">{log.time}</td>
                <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{log.masked_ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
