import { create } from "zustand"
import { persist } from "zustand/middleware"

interface FavoritesState {
  favoriteNoteIds: string[]
  toggleFavorite: (noteId: string) => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favoriteNoteIds: [],
      toggleFavorite: (noteId) =>
        set((state) => ({
          favoriteNoteIds: state.favoriteNoteIds.includes(noteId)
            ? state.favoriteNoteIds.filter((id) => id !== noteId)
            : [...state.favoriteNoteIds, noteId],
        })),
    }),
    { name: "favorites" }
  )
)
