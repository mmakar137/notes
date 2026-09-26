import { useEffect, useState } from 'react';
import { getNotes, createNote, deleteNote } from './api/notes';
import type { Note, CreateNoteData } from './types/note';
import NoteForm from './components/NoteForm/NoteForm';
import NotesList from './components/NotesList/NotesList';
import styles from './App.module.css';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    getNotes()
      .then((data) => setNotes(data))
      .catch((error) => console.error(error));
  }, []);

  async function handleCreate(data: CreateNoteData) {
    try {
      const newNote = await createNote(data);
      setNotes([newNote, ...notes]);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id);
      setNotes(notes.filter((note) => note.id !== id));
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Мои заметки</h1>
      </header>

      <div className={styles.layout}>
        <aside>
          <NoteForm onSubmit={handleCreate} />
        </aside>

        <main>
          <NotesList notes={notes} onDelete={handleDelete} />
        </main>
      </div>
    </div>
  );
}