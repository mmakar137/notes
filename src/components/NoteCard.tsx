import { Link } from "react-router"
import { useFavoritesStore } from "../store/favoritesState"
import type { Note } from "../types"

interface Props {
  note: Note
  onDelete: (id: string) => void
}

export default function NoteCard({ note, onDelete }: Props) {
  const isFavorite = useFavoritesStore(
    (state) => state.favoriteNoteIds.includes(note.id)
  )
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)

  return (
    <article
      className={`flex h-full flex-col gap-3 rounded-md border p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${
        note.hidden
          ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <h2 className="text-center text-lg font-semibold break-words text-[var(--color-text)]">
        <Link
          to={`/notes/${note.id}`}
          className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          {note.title}
        </Link>
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <time dateTime={note.createdAt.toISOString()}>
          {note.createdAt.toLocaleDateString()}
        </time>
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${
            note.hidden
              ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
              : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {note.hidden ? "Hidden" : "Visible"}
        </span>
        <button
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()
            toggleFavorite(note.id)
          }}
          className="rounded-md p-1 text-slate-400 transition-colors duration-200 hover:bg-amber-50 dark:hover:bg-amber-900/40 hover:text-amber-500 dark:hover:text-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`h-5 w-5 ${
              isFavorite ? "fill-amber-400 text-amber-400" : "fill-none text-slate-400"
            }`}
          >
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {note.tags.map((tag, index) => (
          <span
             key={`${tag}-${index}`}
            className="rounded-full bg-blue-50 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {note.content}
      </p>

      <div className="mt-auto flex items-center gap-2">
        <Link
          to={`/notes/${note.id}`}
          className="rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-[#2563eb] transition-colors duration-200 hover:bg-[var(--color-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          View
        </Link>
        <Link
          to={`/notes/${note.id}/edit`}
          className="rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-[#2563eb] transition-colors duration-200 hover:bg-[var(--color-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="mt-auto self-start rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 transition-colors duration-200 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
