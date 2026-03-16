'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import useAuthStore from '@/store/authStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'

export default function AuthListener() {
  const setUser = useAuthStore((s) => s.setUser)
  const setSession = useAuthStore((s) => s.setSession)
  const setSubscription = useSubscriptionStore((s) => s.setSubscription)

  useEffect(() => {
    const supabase = createClient()

    const fetchSubscription = async (userId) => {
      if (!userId) {
        setSubscription(null)
        return
      }

      // Using .limit(1) and checking if data exists instead of .single()
      // This avoids the PGRST116/406 error if the user has no subscription yet
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching subscription:', error)
      }

      setSubscription(data || null)
    }

    // Initialize state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const user = session?.user ?? null
      setUser(user)
      if (user) fetchSubscription(user.id)
    })

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      const user = session?.user ?? null
      setUser(user)
      if (user) {
        fetchSubscription(user.id)
      } else {
        setSubscription(null)
      }
    })

    // Listen for Realtime subscription changes
    let realtimeChannel = null
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      if (user) {
        realtimeChannel = supabase
          .channel('public:subscriptions')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'subscriptions',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log('Realtime subscription update:', payload)
              setSubscription(payload.new)
            }
          )
          .subscribe()
      }
    })

    return () => {
      authSubscription.unsubscribe()
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [setUser, setSession, setSubscription])

  return null
}
