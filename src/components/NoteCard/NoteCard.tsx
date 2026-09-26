import type { Note } from '../../types/note';
import styles from './NoteCard.module.css';

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

function NoteCard({ note, onDelete }: NoteCardProps) {
  function handleDelete() {
    onDelete(note.id);
  }

  const date = new Date(note.createdAt).toLocaleString('ru-RU');

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{note.title}</h3>
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          title="Удалить"
        >
          ✕
        </button>
      </div>

      <p className={styles.content}>{note.content}</p>

      <p className={styles.date}>{date}</p>
    </article>
  );
}

export default NoteCard;