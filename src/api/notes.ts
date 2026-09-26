import type { Note, CreateNoteData } from '../types/note';

const API_URL = 'http://localhost:3001/notes';

export async function getNotes(): Promise<Note[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Не удалось загрузить заметки');
  }
  return response.json();
}

export async function createNote(data: CreateNoteData): Promise<Note> {
  const newNote = {
    title: data.title,
    content: data.content,
    createdAt: new Date().toISOString(),
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newNote),
  });

  if (!response.ok) {
    throw new Error('Не удалось создать заметку');
  }
  return response.json();
}

export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Не удалось удалить заметку');
  }
}