import { type Note, type NoteDTO } from "./types"

export const DB_LINK = "http://localhost:3000"
export const OWN_NOTES_ONLY_MESSAGE = "You can only work with your own notes."

export function mapNoteFromDTO(note: NoteDTO): Note {
  return {
    id: note.id,
    authorId: note.authorId,
    title: note.title,
    content: note.content,
    createdAt: new Date(note.createdAt),
    hidden: note.hidden,
    tags: note.tags,
  }
}
