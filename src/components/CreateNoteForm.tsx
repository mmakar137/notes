import { useState } from "react"
import type { Note } from "../types"
import { useForm, type SubmitHandler } from "react-hook-form"

const TITLE_MAX_LENGTH = 100
const CONTENT_MAX_LENGTH = 2000
const MAX_TAGS = 5
const TAG_MAX_LENGTH = 20

interface Props {
  onSubmit: (note: Note) => Promise<boolean> | void
}

type CreateNoteFormValues = {
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

export default function CreateNoteForm({ onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateNoteFormValues>({
    defaultValues: {
      title: "",
      content: "",
      hidden: false,
      tags: "",
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onFormSubmit: SubmitHandler<CreateNoteFormValues> = async (data) => {
    const note: Note = {
      id: crypto.randomUUID(),
      title: data.title.trim(),
      content: data.content.trim(),
      createdAt: new Date(),
      hidden: data.hidden,
      tags: parseTags(data.tags),
    }

    setIsSubmitting(true)
    await onSubmit(note)
    setIsSubmitting(false)
    reset()
  }

  const fieldClass =
    "w-full rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-[0.95rem] text-[var(--color-text)] placeholder:text-[var(--color-placeholder)] transition-[border-color,box-shadow] duration-150 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] focus:outline-none"

  return (
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
        {isSubmitting ? "Saving..." : "Add note"}
      </button>
    </form>
  )
}
