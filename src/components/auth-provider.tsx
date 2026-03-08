'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const setAuth = useAuthStore((state) => state.setAuth)

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuth(session)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setAuth(session)
        })

        return () => subscription.unsubscribe()
    }, [setAuth])

    return <>{children}</>
}
