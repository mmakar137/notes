import { useState } from 'react';
import type { CreateNoteData } from '../../types/note';
import styles from './NoteForm.module.css';

interface NoteFormProps {
  onSubmit: (data: CreateNoteData) => void;
}

function NoteForm({ onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (title.trim() === '' || content.trim() === '') {
      setError('Заполните все поля');
      return;
    }

    onSubmit({
      title: title.trim(),
      content: content.trim(),
    });

    setTitle('');
    setContent('');
    setError('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Новая заметка</h2>

      <label className={styles.label}>
        Заголовок
        <input
          className={styles.input}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите заголовок"
        />
      </label>

      <label className={styles.label}>
        Текст
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Введите текст заметки"
          rows={4}
        />
      </label>

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.button} type="submit">
        Добавить
      </button>
    </form>
  );
}

export default NoteForm;