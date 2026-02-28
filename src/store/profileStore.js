import { create } from 'zustand'

const useProfileStore = create((set) => ({
  profiles: [],
  activeProfile: null,
  setProfiles: (profiles) => set({ profiles }),
  addProfile: (profile) =>
    set((state) => ({ profiles: [...state.profiles, profile] })),
  updateProfile: (updated) =>
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === updated.id ? updated : p
      ),
      activeProfile:
        state.activeProfile?.id === updated.id ? updated : state.activeProfile,
    })),
  removeProfile: (id) =>
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
      activeProfile: state.activeProfile?.id === id ? null : state.activeProfile,
    })),
  setActiveProfile: (profile) => set({ activeProfile: profile }),
}))

export default useProfileStore
