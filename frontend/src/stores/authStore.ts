import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  tenantId: string | null
  role: string | null
  isAuthenticated: boolean
  setSession: (session: { accessToken: string; refreshToken: string; tenantId: string; role: string }) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      tenantId: null,
      role: null,
      isAuthenticated: false,
      setSession: (session) => set({ ...session, isAuthenticated: true }),
      clearSession: () =>
        set({ accessToken: null, refreshToken: null, tenantId: null, role: null, isAuthenticated: false }),
    }),
    { name: 'controle-de-gastos-auth' },
  ),
)
