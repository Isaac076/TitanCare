import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let token: string | null = null

  if (pathname.startsWith('/p/')) {
    token = pathname.split('/p/')[1]?.split('/')[0]
  } else if (
    pathname.startsWith('/api/patient/') ||
    pathname.startsWith('/api/portal-data') ||
    pathname.startsWith('/api/documents/')
  ) {
    // Leer token desde header x-patient-token enviado por el cliente
    token = request.headers.get('x-patient-token') ?? null
  }

  if (!token || !/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(token)) {
    if (pathname.startsWith('/p/')) {
      return NextResponse.redirect(new URL('/invalid', request.url))
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )

  const { data, error } = await supabase
    .from('access_tokens')
    .select('id, patient_id, is_active')
    .eq('token', token)
    .single()

  if (error || !data || !data.is_active) {
    if (pathname.startsWith('/p/')) {
      return NextResponse.redirect(new URL('/invalid', request.url))
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.next()
  response.headers.set('x-patient-id', data.patient_id)
  response.headers.set('x-token-id', data.id)

  return response
}

export const config = {
  matcher: ['/p/:token*', '/api/patient/:path*', '/api/portal-data', '/api/documents/:path*'],
}
