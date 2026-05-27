'use client'

import { createContext, useContext, ReactNode } from 'react'

const TokenContext = createContext<string>('')

export function TokenProvider({ token, children }: { token: string; children: ReactNode }) {
  return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>
}

export function useToken() {
  return useContext(TokenContext)
}

// Helper — fetch que incluye el token del paciente en cada petición
export function useApiFetch() {
  const token = useToken()

  return async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        'x-patient-token': token,
      },
    })
  }
}
