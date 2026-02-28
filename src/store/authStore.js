import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  clearAuth: () => set({ user: null, session: null }),
}))

export default useAuthStore
