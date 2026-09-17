import type { Session } from "@supabase/supabase-js"
import { create } from "zustand"

interface AuthState {
   isReady: boolean
   isAnonymous: boolean
   email: string | null
   setSession: (session: Session | null) => void
}

/**
 * 認証状態のストア
 *
 * 正は Supabase のセッション。`onAuthStateChange` から更新するだけで永続化しない。
 */
export const useAuthStore = create<AuthState>()((set) => ({
   isReady: false,
   isAnonymous: true,
   email: null,
   setSession: (session) =>
      set({
         isReady: true,
         isAnonymous: session?.user.is_anonymous ?? true,
         email: session?.user.email ?? null,
      }),
}))
