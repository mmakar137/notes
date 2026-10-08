import CreateNoteForm from "./CreateNoteForm";
import NoteCard from "./NoteCard";
import type { Note, NoteDTO } from "./types";
import { useEffect, useState } from "react";
import { DB_LINK, mapNoteFromDTO } from "./utils";
import styles from "./styles.module.css";
function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${DB_LINK}/notes/`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: NoteDTO[]) => {
        setNotes(data.map(mapNoteFromDTO));
        setError("");
      })
      .catch(() =>
        setError("Could not load notes. Is the server running (npm run db)?"),
      );
  }, []);

  const handleSubmit = (note: Note) => {
    return fetch(`${DB_LINK}/notes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(note),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((note: NoteDTO) => {
        setNotes((prev) => [...prev, mapNoteFromDTO(note)]);
        setError("");
        return true;
      })
      .catch(() => {
        setError("Could not save the note.");
        return false;
      });
  };

  const handleDelete = (id: string) => {
    fetch(`${DB_LINK}/notes/${id}`, {
      method: "DELETE",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setNotes((prev) => prev.filter((note) => note.id !== id));
        setError("");
      })
      .catch(() => setError("Could not delete the note."));
  };

  return (
    <div className={styles.page}>
      <h1>Notes</h1>
      <CreateNoteForm onSubmit={handleSubmit}></CreateNoteForm>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.notesGrid}>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onDelete={handleDelete}
          ></NoteCard>
        ))}
      </div>
    </div>
  );
}

export default App;
