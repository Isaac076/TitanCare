# TitanCare — Implant Patient Portal

A premium medical PWA for patients implanted with the Coloplast Titan penile prosthesis.
Provides instant, secure access to implant documents via NFC card tap or QR code scan.

---

## Tech Stack

| Layer      | Choice            | Reason                                             |
|------------|-------------------|----------------------------------------------------|
| Framework  | Next.js 14 (App Router) | Edge middleware, SSR, PWA support             |
| Styling    | Tailwind CSS      | Fast iteration, consistent design tokens           |
| Database   | Supabase (Postgres) | RLS policies enforce security at DB level        |
| Storage    | Supabase Storage  | Signed URLs, private buckets                       |
| Hosting    | Vercel            | Edge network, zero-config Next.js                  |
| Auth       | Custom PIN + Supabase service role | No patient login required       |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# 3. Run database migration
# In Supabase dashboard > SQL Editor, run:
# supabase/migrations/001_initial_schema.sql

# 4. Create Supabase Storage bucket
# Name: patient-documents
# Access: private (no public access)

# 5. Start dev server
npm run dev
```

---

## Project Structure

```
titancare/
├── app/
│   ├── p/[token]/          Patient portal (NFC/QR entry point)
│   ├── admin/              Staff management panel
│   ├── invalid/            Invalid token error page
│   └── api/
│       ├── auth/verify-pin/     PIN verification endpoint
│       └── documents/signed-url/ Secure document URL generator
├── components/portal/
│   ├── PatientPortal.tsx   Main portal UI
│   ├── PINGate.tsx         4-digit PIN entry overlay
│   ├── DocumentViewer.tsx  Signed URL fetcher + PDF opener
│   └── PhysicianContact.tsx Contact sheet overlay
├── lib/
│   ├── supabase/client.ts  Browser Supabase client
│   ├── supabase/server.ts  Server + admin Supabase clients
│   └── types.ts            Shared TypeScript interfaces
├── middleware.ts            Edge token validation (runs before every /p/ request)
└── supabase/migrations/    SQL schema files
```

---

## Security Architecture

### Token Flow
```
NFC tap / QR scan → /p/ABCD-1234
  ↓
middleware.ts validates token at edge (Supabase query)
  ↓
Valid → server renders portal (patient_id passed via header, never URL)
Invalid → redirect to /invalid
  ↓
User taps "Implant Details"
  ↓
PINGate prompts for 4-digit PIN
  ↓
/api/auth/verify-pin: HMAC-SHA256 hash comparison, rate limited (5 attempts / 15 min)
  ↓
Success → pin_sessions record created (1-hour expiry)
  ↓
/api/documents/signed-url: verifies pin_session, generates 15-min signed URL
  ↓
PDF opens in browser tab — storage path never exposed
```

### Key security properties
- **No PII in URL** — token is opaque, maps to patient_id only in DB
- **Private storage** — Supabase bucket has no public access
- **Signed URLs** — 15-minute expiry, generated server-side only
- **PIN hashed** — HMAC-SHA256 with per-environment salt, never stored plain
- **Rate limiting** — 5 PIN attempts per 15-minute window
- **RLS** — Row Level Security at Postgres level, not just app code
- **IP hashing** — Access logs store hashed IPs (privacy-preserving audit trail)
- **Security headers** — X-Frame-Options, CSP, Referrer-Policy set on all responses

---

## NFC Card Setup

### Recommended chip: NTAG215
- 504 bytes — enough for full tokenized URL + metadata
- Universal iOS (iPhone 7+) and Android support
- ~$0.40–0.80/chip in volume from NXP distributors
- Lock byte support — prevent re-programming after writing

### Programming instructions
1. Purchase NTAG215 cards (NXP, Identiv, or generic)
2. Use **NFC Tools** (iOS/Android) or **TagWriter by NXP**
3. Write a single NDEF record:
   - Type: URI
   - Value: `https://titan-care.com/p/ABCD-1234`
4. Lock the chip (write-protect) before distributing to patient
5. Test with both iPhone and Android before issuing

### Token generation
Use the Postgres function included in the migration:
```sql
select generate_patient_token(); -- Returns e.g. 'M7PK-X2RN'
```
Tokens use an unambiguous character set (no 0/O, 1/I confusion).

---

## QR Code Generation

Generate QR codes pointing to the same tokenized URL:

```bash
# Using qrcode npm package
npx qrcode "https://titan-care.com/p/ABCD-1234" -o patient-card.png \
  --size 300 --margin 2 --error-correction H
```

Or generate programmatically in the admin panel (add `qrcode` package).

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# APP_SECRET
# PIN_SALT
```

### Required Vercel settings
- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Node.js version**: 20.x

---

## Adding a Patient (Admin Flow)

1. Create physician record in `physicians` table
2. Create patient record in `patients` table
3. Create implant record in `implants` table
4. Generate token: `select generate_patient_token()`
5. Insert into `access_tokens` with generated token
6. Hash patient's PIN: `select encode(hmac('patientId:1234', 'your_salt', 'sha256'), 'hex')`
7. Insert into `patient_pins`
8. Upload PDFs to Supabase Storage under `patient-documents/{patient_id}/`
9. Insert document records in `documents` table
10. Program NFC card with `https://titan-care.com/p/{token}`

---

## Roadmap

### V1 (Current — MVP)
- [x] NFC/QR tokenized patient portal
- [x] Public document access (MRI, airport letter, post-op, FAQ)
- [x] PIN-gated private implant sheet
- [x] Signed URL document delivery
- [x] Admin panel (patients, documents, logs)
- [x] PWA (installable, offline-ready for public docs)
- [x] Security headers + RLS + rate limiting

### V2
- [ ] Multi-language (Spanish, French, Portuguese)
- [ ] Push notifications for post-op follow-up reminders
- [ ] QR code generation in admin panel
- [ ] Document versioning with change history
- [ ] Multi-clinic / multi-physician support
- [ ] Analytics dashboard

### V3
- [ ] AI-powered FAQ chatbot (Claude API)
- [ ] Patient-reported outcomes tracking
- [ ] FHIR API integration (EHR connectivity)
- [ ] Automated NFC card fulfillment workflow
- [ ] Telemedicine video link integration

---

## HIPAA Considerations

This app is designed with HIPAA-conscious principles:
- No PHI in URLs or server logs
- Access logs use hashed IPs and opaque patient IDs
- Private storage with expiring signed URLs
- PIN authentication before accessing sensitive documents
- Service role key used only server-side, never exposed to client

**Note:** Full HIPAA compliance requires a Business Associate Agreement (BAA) with Supabase.
Supabase offers BAAs on their Team and Enterprise plans.
Consult with a healthcare compliance attorney before launching.
