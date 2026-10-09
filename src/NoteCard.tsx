import type { Note } from "./types"
import styles from "./styles.module.css"

interface Props {
  note: Note
  onDelete: (id: string) => void
}

export default function NoteCard({note, onDelete,}: Props) {
  return (
    <div className={styles.card}>
      <h2>{note.title}</h2>
      <p>{note.content}</p>
      <div>
        <span>{note.hidden ? "Hidden" : "Visible"} | </span>
        <span>{note.tags.join(", ")}</span>
      </div>
      <p>{note.createdAt.toLocaleDateString()}</p>
      <button
        type="button"
        onClick={() => onDelete(note.id)}
      >
        Delete
      </button>
    </div>
  )
}
