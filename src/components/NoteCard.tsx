import { Link } from "react-router"
import type { Note } from "../types"

interface Props {
  note: Note
  onDelete: (id: string) => void
}

export default function NoteCard({ note, onDelete }: Props) {
  return (
    <article
      className={`flex h-full flex-col gap-3 rounded-md border p-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${
        note.hidden
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <h2 className="text-center text-lg font-semibold break-words text-slate-900">
        {note.title}
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <time dateTime={note.createdAt.toISOString()}>
          {note.createdAt.toLocaleDateString()}
        </time>
        <span
          className={`rounded-full px-2 py-0.5 font-medium ${
            note.hidden
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {note.hidden ? "Hidden" : "Visible"}
        </span>
      </div>

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

      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
        {note.content}
      </p>

      <div className="mt-auto flex items-center gap-2">
        <Link
          to={`/notes/${note.id}/edit`}
          className="rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-[#2563eb] transition-colors duration-200 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Edit
        </Link>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          className="mt-auto self-start rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
