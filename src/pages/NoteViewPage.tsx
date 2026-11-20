import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import type { Note, NoteDTO } from "../types"
import { DB_LINK, mapNoteFromDTO } from "../utils"

export default function NoteViewPage() {
  const { id } = useParams()
  const [note, setNote] = useState<Note | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    fetch(`${DB_LINK}/notes/${encodeURIComponent(id ?? "")}`)
      .then(async (res) => {
        if (res.status === 404) throw new Error("NOT_FOUND")
        if (!res.ok) throw new Error("LOAD_FAILED")
        return mapNoteFromDTO((await res.json()) as NoteDTO)
      })
      .then((loaded) => {
        if (!active) return
        setNote(loaded)
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
  }, [id])

  return (
    <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14">
      <h1 className="mb-9 text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
        {note ? note.title : "View note"}
      </h1>
      {error && (
        <p className="mb-6 w-full max-w-[560px] rounded-[10px] border border-red-500/20 bg-[#fef2f2] px-4 py-3 text-[0.9rem] text-[#ef4444]">
          {error}
        </p>
      )}
      {note && (
        <article className="mb-14 flex w-full max-w-[560px] flex-col gap-5 rounded-[14px] border border-[#e2e8f0] bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[#64748b]">
            <time dateTime={note.createdAt.toISOString()}>
              {note.createdAt.toLocaleDateString()}
            </time>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                note.hidden
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
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
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p
            id="view-body"
            className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-[#0f172a]"
          >
            {note.content}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/notes"
              className="rounded-[10px] border border-[#e2e8f0] bg-white p-[11px] text-[0.95rem] font-semibold text-[#2563eb] transition-colors duration-150 hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
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
