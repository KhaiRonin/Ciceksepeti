export const GIFT_NOTE_RECIPIENT_OPTIONS = [
  { value: 'SEVGILI', label: 'Sevgili' },
  { value: 'ANNE', label: 'Anne' },
  { value: 'BABA', label: 'Baba' },
  { value: 'ES', label: 'Eş' },
  { value: 'ARKADAS', label: 'Arkadaş' },
  { value: 'OGRETMEN', label: 'Öğretmen' },
  { value: 'KARDES', label: 'Kardeş' },
  { value: 'DIGER', label: 'Diğer' },
] as const;

export type GiftNoteRecipientType = (typeof GIFT_NOTE_RECIPIENT_OPTIONS)[number]['value'];

export function getGiftNoteRecipientLabel(type: string): string {
  return GIFT_NOTE_RECIPIENT_OPTIONS.find((item) => item.value === type)?.label ?? type;
}
