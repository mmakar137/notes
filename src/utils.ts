import { type Note, type NoteDTO } from "./types"

export const DB_LINK = "http://localhost:3000"

export function mapNoteFromDTO(note: NoteDTO): Note {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    createdAt: new Date(note.createdAt),
    hidden: note.hidden,
    tags: note.tags,
  }
}
