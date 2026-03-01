'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import useAuthStore from '@/store/authStore'

export default function AuthListener() {
  const setUser = useAuthStore((s) => s.setUser)
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    const supabase = createClient()

    // Initialize state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setSession])

  return null
}
