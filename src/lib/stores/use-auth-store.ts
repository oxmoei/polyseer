import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/**
 * 简化的认证 store - 不依赖 Supabase/Valyu
 * 用于本地开发和测试
 */

interface SimpleUser {
  id: string
  email: string
  name?: string
  valyu_sub?: string
  valyu_organisation_name?: string
  user_metadata?: {
    avatar_url?: string
    [key: string]: any
  }
}

interface AuthState {
  user: SimpleUser | null
  loading: boolean
  initialized: boolean
}

interface AuthActions {
  setUser: (user: SimpleUser | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  signInWithValyu: () => Promise<{ data?: any; error?: any }>
  signOut: () => Promise<{ error?: any }>
  initialize: () => void
  // Compatibility methods
  getValyuAccessToken: () => string | null
  completeValyuAuth: (idToken: string, accessToken: string, refreshToken: string, expiresIn: number) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
  setValyuTokens: (accessToken: string, refreshToken: string, expiresIn: number) => void
  setApiKeyStatus: (hasApiKey: boolean, creditsAvailable: boolean) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      initialized: false,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      signInWithValyu: async () => {
        // 简化版本 - 直接设置一个本地用户
        const localUser: SimpleUser = {
          id: 'local-user',
          email: 'local@polyseer.dev',
          name: 'Local User',
        }
        set({ user: localUser, loading: false })
        return { data: { user: localUser } }
      },

      signOut: async () => {
        set({ user: null })
        return {}
      },

      initialize: () => {
        if (get().initialized) return
        set({ initialized: true, loading: false })
        console.log('[Auth] Initialized (simplified mode - no auth required)')
      },

      // Compatibility stubs
      getValyuAccessToken: () => null,
      completeValyuAuth: async () => ({ success: true }),
      refreshUser: async () => {},
      setValyuTokens: () => {},
      setApiKeyStatus: () => {},
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
      }),
      skipHydration: true,
    }
  )
)
