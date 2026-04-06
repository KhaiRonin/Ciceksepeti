import { writeCopiedNoteToStorage } from '@/lib/note-copy';

type HandoffResult = {
  ok: boolean;
  normalized: string;
  clipboardOk: boolean;
  protocolTriggered: boolean;
};

function normalizeNote(note: string): string {
  return note.trim();
}

function triggerCustomProtocol(url: string): boolean {
  if (typeof document === 'undefined') return false;

  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    setTimeout(() => {
      iframe.remove();
    }, 1200);

    return true;
  } catch {
    return false;
  }
}

export async function handoffNote(note: string): Promise<HandoffResult> {
  const normalized = normalizeNote(note);

  if (!normalized) {
    return {
      ok: false,
      normalized: '',
      clipboardOk: false,
      protocolTriggered: false,
    };
  }

  writeCopiedNoteToStorage(normalized);

  let clipboardOk = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalized);
      clipboardOk = true;
    }
  } catch {
    clipboardOk = false;
  }

  const encoded = encodeURIComponent(normalized);
  const protocolCandidates = [
    `kibrisciceksepetim://note?text=${encoded}`,
    `kibrisciceksepetim://set-note?text=${encoded}`,
  ];

  let protocolTriggered = false;
  for (const candidate of protocolCandidates) {
    const fired = triggerCustomProtocol(candidate);
    protocolTriggered = protocolTriggered || fired;
    if (fired) break;
  }

  return {
    ok: true,
    normalized,
    clipboardOk,
    protocolTriggered,
  };
}
