import { useState } from "react"
import type { Note } from "./types"
import styles from "./styles.module.css"
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

  return (
    <form className={styles.form} onSubmit={handleSubmit(onFormSubmit)}>
      <div>
        {errors.title && <p>{errors.title.message}</p>}
        <input
          type="text"
          placeholder="Title"
          {...register("title", { validate: getTitleError })}
        />
      </div>

      <div>
        {errors.content && <p>{errors.content.message}</p>}
        <textarea
          placeholder="Content"
          {...register("content", { validate: getContentError })}
        />
      </div>

      <div>
        {errors.tags && <p>{errors.tags.message}</p>}
        <input
          type="text"
          placeholder="Tags"
          {...register("tags", {
            validate: (value) => getTagsError(parseTags(value)),
          })}
        />
      </div>

      <div>
        <label>
          <input type="checkbox" {...register("hidden")} />
          Hidden
        </label>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Add note"}
      </button>
    </form>
  )
}