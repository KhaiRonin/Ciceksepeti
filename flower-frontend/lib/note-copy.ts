const NOTE_KEYS = [
  'copied_note_text',
  'copiedNoteText',
  'copied_note',
  'note_copy_text',
  'gift_note',
  'giftNote',
  'copiedGiftNote',
  'copied_gift_note',
  'flower_note',
  'order_gift_note',
  'copied_text',
  'copiedText',
];

export const NOTE_COPY_STORAGE_KEY = NOTE_KEYS[0];

function normalizeNote(value: string | null): string {
  return (value ?? '').trim();
}

export function readCopiedNoteFromStorage(): string {
  if (typeof window === 'undefined') return '';

  for (const key of NOTE_KEYS) {
    const value = normalizeNote(window.localStorage.getItem(key));
    if (value) return value;

    const sessionValue = normalizeNote(window.sessionStorage.getItem(key));
    if (sessionValue) return sessionValue;
  }

  return '';
}

export function writeCopiedNoteToStorage(note: string): void {
  if (typeof window === 'undefined') return;

  const normalized = note.trim();
  if (!normalized) {
    window.localStorage.removeItem(NOTE_COPY_STORAGE_KEY);
    window.sessionStorage.removeItem(NOTE_COPY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(NOTE_COPY_STORAGE_KEY, normalized);
  window.sessionStorage.setItem(NOTE_COPY_STORAGE_KEY, normalized);
}

export async function readNoteFromClipboard(): Promise<string> {
  if (typeof window === 'undefined') return '';
  if (!window.isSecureContext || !navigator.clipboard?.readText) return '';

  try {
    const text = await navigator.clipboard.readText();
    return normalizeNote(text);
  } catch {
    return '';
  }
}
