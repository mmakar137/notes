import type { Note } from '../../types/note';
import NoteCard from '../NoteCard/NoteCard';
import styles from './NotesList.module.css';

interface NotesListProps {
  notes: Note[];
  onDelete: (id: string) => void;
}

function NotesList({ notes, onDelete }: NotesListProps) {
  if (notes.length === 0) {
    return <p className={styles.empty}>Пока нет заметок — добавьте первую!</p>;
  }

  return (
    <div className={styles.list}>
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default NotesList;
