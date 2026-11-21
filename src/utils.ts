import { type Note, type NoteDTO } from "./types"

export const DB_LINK = "http://localhost:3000"
export const OWN_NOTES_ONLY_MESSAGE = "You can only work with your own notes."
export const NOTE_ACCESS_MESSAGE = `Note not found. ${OWN_NOTES_ONLY_MESSAGE}`

// json-server: _where с оператором eq сравнивает строку со строкой.
// Сервер вернёт заметку только если и id, и authorId совпадают,
// поэтому чужой контент не покинет сервер.
export function ownNoteUrl(noteId: string, userId: string): string {
  const where = JSON.stringify({
    id: { eq: noteId },
    authorId: { eq: userId },
  })
  return `${DB_LINK}/notes?_where=${encodeURIComponent(where)}`
}

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
