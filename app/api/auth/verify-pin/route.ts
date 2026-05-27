import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Rate limiting store (use Redis in production)
const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(patientId: string): boolean {
  const now = Date.now()
  const entry = attempts.get(patientId)

  if (!entry || now > entry.resetAt) {
    attempts.set(patientId, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_ATTEMPTS) return false

  entry.count++
  return true
}

function hashPin(pin: string, patientId: string): string {
  return crypto
    .createHmac('sha256', process.env.PIN_SALT!)
    .update(`${patientId}:${pin}`)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { patientId, pin } = await request.json()

    if (!patientId || !pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (!checkRateLimit(patientId)) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
    }

    const supabase = createAdminClient()
    const pinHash = hashPin(pin, patientId)

    const { data, error } = await supabase
      .from('patient_pins')
      .select('id')
      .eq('patient_id', patientId)
      .eq('pin_hash', pinHash)
      .single()

    if (error || !data) {
      // Constant-time response to prevent timing attacks
      await new Promise((r) => setTimeout(r, 200))
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    // Clear rate limit on success
    attempts.delete(patientId)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
