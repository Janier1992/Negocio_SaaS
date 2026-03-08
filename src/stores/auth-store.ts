import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    session: Session | null
    isLoading: boolean
    setAuth: (session: Session | null) => void
    resetAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    session: null,
    isLoading: true,
    setAuth: (session) => set({
        session,
        user: session?.user ?? null,
        isLoading: false
    }),
    resetAuth: () => set({
        session: null,
        user: null,
        isLoading: false
    })
}))
