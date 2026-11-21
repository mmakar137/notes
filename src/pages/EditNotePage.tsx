import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useAuthStore } from "../store/authState"
import { useToastStore } from "../store/toastState"
import type { NoteDTO } from "../types"
import {
  DB_LINK,
  mapNoteFromDTO,
  NOTE_ACCESS_MESSAGE,
  ownNoteUrl,
} from "../utils"

const TITLE_MAX_LENGTH = 100
const CONTENT_MAX_LENGTH = 2000
const MAX_TAGS = 5
const TAG_MAX_LENGTH = 20

type EditNoteFormValues = {
  title: string
  content: string
  hidden: boolean
  tags: string
}

function getTitleError(title: string) {
  if (title.length === 0) return "Title is required"
  if (title.length > TITLE_MAX_LENGTH) {
    return `Name of the title is too long (more than ${TITLE_MAX_LENGTH})`
  }
  return true
}

function getContentError(content: string) {
  if (content.length > CONTENT_MAX_LENGTH) {
    return `Content is too long (more than ${CONTENT_MAX_LENGTH})`
  }
  return true
}

function getTagsError(tags: string[]) {
  if (tags.length > MAX_TAGS) {
    return `You can only add up to ${MAX_TAGS} tags`
  }

  const tooLongTag = tags.find((tag) => tag.length > TAG_MAX_LENGTH)
  if (tooLongTag) {
    return `Tag "${tooLongTag}" is too long (max ${TAG_MAX_LENGTH} characters)`
  }

  const invalidTag = tags.find(
    (tag) => !/^[a-zA-Z0-9а-яА-ЯёЁ-]+$/.test(tag)
  )
  if (invalidTag) {
    return `Tag "${invalidTag}" contains invalid characters (use only letters, numbers, and hyphens)`
  }

  return true
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag, index, arr) => {
      if (!tag) return false
      return (
        arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index
      )
    })
}

export default function EditNotePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const addToast = useToastStore((state) => state.addToast)
  const [error, setError] = useState("")
  const [loaded, setLoaded] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditNoteFormValues>({
    defaultValues: { title: "", content: "", hidden: false, tags: "" },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        const note = mapNoteFromDTO((await res.json()) as NoteDTO)
        if (!active) return
        reset({
          title: note.title,
          content: note.content,
          hidden: note.hidden,
          tags: note.tags.join(", "),
        })
        setLoaded(true)
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
  }, [id, reset, user?.id])

  const onFormSubmit: SubmitHandler<EditNoteFormValues> = async (data) => {
    setError("")
    setIsSubmitting(true)
    try {
      const res = await fetch(`${DB_LINK}/notes/${encodeURIComponent(id ?? "")}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title.trim(),
          content: data.content.trim(),
          hidden: data.hidden,
          tags: parseTags(data.tags),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      addToast(`Note "${data.title.trim()}" updated`)
      navigate("/notes")
    } catch {
      setError("Could not save the note.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fieldClass =
    "w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[0.95rem] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] transition-[border-color,box-shadow] duration-150 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] focus:outline-none"

  return (
    <div className="mx-auto flex min-h-screen max-w-[1080px] flex-col items-center px-5 py-14">
      <h1 className="mb-9 text-center text-[2.25rem] font-bold tracking-[-0.025em] text-[var(--color-text)]">
        Edit note
      </h1>
      {error && (
        <p className="mb-6 w-full max-w-[560px] rounded-[10px] border border-red-500/20 bg-[var(--color-error-bg)] px-4 py-3 text-[0.9rem] text-[var(--color-error-text)]">
          {error}
        </p>
      )}
      {loaded && (
        <form
          className="mb-14 flex w-full max-w-[560px] flex-col gap-[18px] rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-sm transition-shadow duration-200 focus-within:shadow-md"
          onSubmit={handleSubmit(onFormSubmit)}
        >
          <div className="flex flex-col gap-1.5">
            {errors.title && (
              <p className="text-[0.825rem] font-medium text-[var(--color-error-text)]">
                {errors.title.message}
              </p>
            )}
            <input
              id="edit-title"
              type="text"
              placeholder="Title"
              className={fieldClass}
              {...register("title", { validate: getTitleError })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            {errors.content && (
              <p className="text-[0.825rem] font-medium text-[var(--color-error-text)]">
                {errors.content.message}
              </p>
            )}
            <textarea
              id="edit-content"
              placeholder="Content"
              className={`${fieldClass} min-h-[110px] resize-y`}
              {...register("content", { validate: getContentError })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            {errors.tags && (
              <p className="text-[0.825rem] font-medium text-[var(--color-error-text)]">
                {errors.tags.message}
              </p>
            )}
            <input
              id="edit-tags"
              type="text"
              placeholder="Tags"
              className={fieldClass}
              {...register("tags", {
                validate: (value) => getTagsError(parseTags(value)),
              })}
            />
          </div>

          <div>
            <label className="flex cursor-pointer flex-row items-center gap-2.5 text-[0.9rem] text-[var(--color-text-muted)] select-none">
              <input
                id="edit-hidden"
                type="checkbox"
                className="h-[18px] w-[18px] cursor-pointer accent-[#2563eb]"
                {...register("hidden")}
              />
              Hidden
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-[10px] bg-[#2563eb] p-[11px] text-[0.95rem] font-semibold text-white transition-colors duration-150 hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save note"}
          </button>
        </form>
      )}
    </div>
  )
}
