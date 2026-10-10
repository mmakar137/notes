import CreateNoteForm from "./CreateNoteForm"
import NoteCard from "./NoteCard"
import type { Note, NoteDTO, NoteFilters } from "./types"
import { useEffect, useState } from "react"
import { DB_LINK, mapNoteFromDTO } from "./utils"
import styles from "./styles.module.css"
import NoteFilterForm from "./NoteFilterForm"

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [error, setError] = useState("")
  const [filters, setFilters] = useState<NoteFilters>({
    sort: (params) => params.set("_sort", "-createdAt"),
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleFilterChange = (
    filter: string,
    fn: (params: URLSearchParams) => void
  ) => {
    setFilters((prev) => ({ ...prev, [filter]: fn }))
  }

  const refetchNotes = () => {
    const params = Object.values(filters).reduce(
      (acc, fn) => {
        fn(acc)
        return acc
      },
      new URLSearchParams()
    )

    const query = params.toString() ? `?${params.toString()}` : ""

    return fetch(`${DB_LINK}/notes${query}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: NoteDTO[]) => {
        setNotes(data.map(mapNoteFromDTO))
        setError("")
      })
      .catch(() =>
        setError(
          "Could not load notes. Is the server running (npm run db)?"
        )
      )
  }

  useEffect(() => {
    refetchNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)))

  const visibleNotes =
    selectedTags.length === 0
      ? notes
      : notes.filter((note) =>
          selectedTags.some((tag) => note.tags.includes(tag))
        )

  const handleSubmit = (note: Note) => {
    return fetch(`${DB_LINK}/notes/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(() => refetchNotes())
      .then(() => true)
      .catch(() => {
        setError("Could not save the note.")
        return false
      })
  }

  const handleDelete = (id: string) => {
    fetch(`${DB_LINK}/notes/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setNotes((prev) => prev.filter((note) => note.id !== id))
        setError("")
      })
      .catch(() => setError("Could not delete the note."))
  }

  return (
    <div className={styles.page}>
      <h1>Notes</h1>
      <CreateNoteForm onSubmit={handleSubmit}></CreateNoteForm>
      <NoteFilterForm
        onFilterChange={handleFilterChange}
        allTags={allTags}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />
      {error && <p className={styles.error}>{error}</p>}
      {visibleNotes.length === 0 ? (
        <p>No notes found</p>
      ) : (
        <div className={styles.notesGrid}>
          {visibleNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
            ></NoteCard>
          ))}
        </div>
      )}
    </div>
  )
}

export default App