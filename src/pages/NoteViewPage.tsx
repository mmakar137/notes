import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { useAuthStore } from "../store/authState"
import type { Note, NoteDTO } from "../types"
import {
  DB_LINK,
  mapNoteFromDTO,
  NOTE_ACCESS_MESSAGE,
  ownNoteUrl,
} from "../utils"

export default function NoteViewPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    const noteId = id ?? ""
    const userId = user?.id ?? ""

    fetch(ownNoteUrl(noteId, userId))
      .then(async (res) => {
        if (!res.ok) throw new Error("LOAD_FAILED")
        return (await res.json()) as NoteDTO[]
      })
      .then(async (owned) => {
        if (!active) return
        if (
          !Array.isArray(owned) ||
          !owned.some(
            (candidate) =>
              candidate.id === noteId && candidate.authorId === userId
          )
        ) {
          setError(NOTE_ACCESS_MESSAGE)
          return
        }
        const res = await fetch(`${DB_LINK}/notes/${encodeURIComponent(noteId)}`)
        if (res.status === 404) throw new Error("NOT_FOUND")
        if (!res.ok) throw new Error("LOAD_FAILED")
        const loaded = mapNoteFromDTO((await res.json()) as NoteDTO)
        if (active) setNote(loaded)
      })
      .catch((e: Error) => {
        if (!active) return
        setError(
          e.message === "NOT_FOUND"
            ? "Note not found."
            : "Could not load note. Is the server running (npm run db)?"
        )
      })
    return () => {
      active = false
    }
  }, [id, user?.id])

  return (
    <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14">
      <h1 className="mb-9 text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
        {note ? note.title : "View note"}
      </h1>
      {error && (
        <p className="mb-6 w-full max-w-[560px] rounded-[10px] border border-red-500/20 bg-[var(--color-error-bg)] px-4 py-3 text-[0.9rem] text-[var(--color-error-text)]">
          {error}
        </p>
      )}
      {note && (
        <article className="mb-14 flex w-full max-w-[560px] flex-col gap-5 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--color-text-muted)]">
            <time dateTime={note.createdAt.toISOString()}>
              {note.createdAt.toLocaleDateString()}
            </time>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                note.hidden
                  ? "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
                  : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {note.hidden ? "Hidden" : "Visible"}
            </span>
          </div>

          {note.tags.length > 0 && (
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
          )}

          <p
            id="view-body"
            className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-[var(--color-text)]"
          >
            {note.content}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/notes"
              className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-[11px] text-[0.95rem] font-semibold text-[#2563eb] transition-colors duration-150 hover:bg-[var(--color-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Back to notes
            </Link>
            <Link
              to={`/notes/${note.id}/edit`}
              className="rounded-[10px] bg-[#2563eb] p-[11px] text-[0.95rem] font-semibold text-white transition-colors duration-150 hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Edit
            </Link>
          </div>
        </article>
      )}
    </div>
  )
}
