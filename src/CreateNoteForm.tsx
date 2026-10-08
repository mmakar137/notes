import { useState } from "react";
import type { Note } from "./types";
import styles from "./styles.module.css";

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;
const MAX_TAGS = 5;
const TAG_MAX_LENGTH = 20;

interface Props {
  onSubmit: (note: Note) => Promise<boolean>;
}

function getTitleError(title: string) {
  if (title.length === 0) return "Title is required";
  if (title.length > TITLE_MAX_LENGTH) {
    return `Name of the title is too long (more than ${TITLE_MAX_LENGTH})`;
  }
  return "";
}

function getContentError(content: string) {
  if (content.length > CONTENT_MAX_LENGTH) {
    return `Content is too long (more than ${CONTENT_MAX_LENGTH})`;
  }
  return "";
}

function getTagsError(tags: string[]) {
  if (tags.length > MAX_TAGS) {
    return `You can only add up to ${MAX_TAGS} tags`;
  }

  const tooLongTag = tags.find((tag) => tag.length > TAG_MAX_LENGTH);
  if (tooLongTag) {
    return `Tag "${tooLongTag}" is too long (max ${TAG_MAX_LENGTH} characters)`;
  }

  const invalidTag = tags.find((tag) => !/^[a-zA-Z0-9а-яА-ЯёЁ-]+$/.test(tag));
  if (invalidTag) {
    return `Tag "${invalidTag}" contains invalid characters (use only letters, numbers, and hyphens)`;
  }

  return "";
}

export default function CreateNoteForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState("");
  const [hidden, setHidden] = useState(false);
  const [tags, setTags] = useState<string>("");
  const [tagsError, setTagsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const currentTitle = title.trim();
    const currentContent = content.trim();
    const currentTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag, index, arr) => {
        if (!tag) return false;
        return (
          arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === index
        );
      });

    const newTitleError = getTitleError(currentTitle);
    const newContentError = getContentError(currentContent);
    const newTagsError = getTagsError(currentTags);

    setTitleError(newTitleError);
    setContentError(newContentError);
    setTagsError(newTagsError);

    if (newTitleError || newContentError || newTagsError) return;

    const note: Note = {
      id: Date.now().toString(),
      title: currentTitle,
      content: currentContent,
      createdAt: new Date(),
      hidden,
      tags: currentTags,
    };

    setIsSubmitting(true);
    onSubmit(note).then((saved) => {
      setIsSubmitting(false);
      if (!saved) return;

      setTitle("");
      setContent("");
      setHidden(false);
      setTags("");
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div>
        {titleError && <p>{titleError}</p>}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError("");
          }}
        />
      </div>

      <div>
        {contentError && <p>{contentError}</p>}
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (contentError) setContentError("");
          }}
        />
      </div>

      <div>
        {tagsError && <p>{tagsError}</p>}
        <input
          type="text"
          placeholder="Tags"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            if (tagsError) setTagsError("");
          }}
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => setHidden(e.target.checked)}
          ></input>
          Hidden
        </label>
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Add note"}
      </button>
    </form>
  );
}
