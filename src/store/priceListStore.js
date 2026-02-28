import { create } from 'zustand'

const usePriceListStore = create((set) => ({
  priceLists: [],
  currentList: null,
  isEditing: false,
  isGenerating: false,
  setPriceLists: (priceLists) => set({ priceLists }),
  addPriceList: (list) =>
    set((state) => ({ priceLists: [list, ...state.priceLists] })),
  updatePriceLists: (updated) =>
    set((state) => ({
      priceLists: state.priceLists.map((l) =>
        l.id === updated.id ? updated : l
      ),
      currentList: state.currentList?.id === updated.id ? updated : state.currentList,
    })),
  removePriceList: (id) =>
    set((state) => ({
      priceLists: state.priceLists.filter((l) => l.id !== id),
      currentList: state.currentList?.id === id ? null : state.currentList,
    })),
  setCurrentList: (list) => set({ currentList: list }),
  setEditing: (val) => set({ isEditing: val }),
  setGenerating: (val) => set({ isGenerating: val }),
}))

export default usePriceListStore
