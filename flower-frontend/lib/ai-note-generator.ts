export type AINoteTone = 'romantik' | 'samimi' | 'resmi' | 'eglenceli';
export type AINoteLength = 'kisa' | 'orta' | 'uzun';

export type AINoteInput = {
  intent: string;
  recipient?: string;
  tone: AINoteTone;
  length: AINoteLength;
  variantSeed?: number;
};

type NotePurpose = 'ozur' | 'tesekkur' | 'kutlama' | 'sevgi' | 'destek' | 'genel';

const OPENERS: Record<AINoteTone, string[]> = {
  romantik: ['Canım,', 'Kalbimin en güzel insanı,', 'Bir tanem,'],
  samimi: ['Sevgili dostum,', 'Canım,', 'Merhaba,'],
  resmi: ['Sayın', 'Değerli', 'İyi dileklerimle,'],
  eglenceli: ['Sürpriz!', 'Kocaman bir gülümseme ile,', 'Bugün sana minik bir neşe bıraktım!'],
};

const CLOSERS: Record<AINoteTone, string[]> = {
  romantik: ['Seni çok seviyorum.', 'İyi ki varsın.', 'Kalbim hep seninle.'],
  samimi: ['Sevgiyle.', 'En güzel dileklerimle.', 'Gülümseyerek kal.'],
  resmi: ['Saygılarımla.', 'İyi dileklerimle.', 'Teşekkür ederim.'],
  eglenceli: ['Kocaman gülümse :)', 'Harika bir gün olsun!', 'Mutluluk hep seninle olsun!'],
};

function pick(items: string[], seed: number): string {
  return items[Math.abs(seed) % items.length];
}

function cleanIntent(raw: string): string {
  return raw
    .replace(/\b(mesaj(ı|i)?\s+istiyorum|not\s+istiyorum|yazar mısın|yazabilir misin)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectPurpose(intent: string): NotePurpose {
  const t = intent.toLowerCase();
  if (/(özür|af|hata|kırdım|kırmış|pişman)/.test(t)) return 'ozur';
  if (/(teşekkür|sağ ol|minnettar)/.test(t)) return 'tesekkur';
  if (/(doğum günü|kutla|tebrik|başarı|yıldönümü)/.test(t)) return 'kutlama';
  if (/(sevgi|aşk|özledim|canım|bir tanem|romantik)/.test(t)) return 'sevgi';
  if (/(geçmiş olsun|yanındayım|destek|güç|moral)/.test(t)) return 'destek';
  return 'genel';
}

function buildBody(purpose: NotePurpose, tone: AINoteTone, length: AINoteLength): string {
  const shortByPurpose: Record<NotePurpose, string> = {
    ozur: 'Seni kırdığım için gerçekten üzgünüm. Gönlünü almak için elimden geleni yapacağım.',
    tesekkur: 'Hayatıma kattığın güzellikler için sana içtenlikle teşekkür ederim.',
    kutlama: 'Bu güzel gününü yürekten kutluyor, mutluluğunun daim olmasını diliyorum.',
    sevgi: 'Sana olan sevgimi her gün daha derinden hissediyorum; iyi ki varsın.',
    destek: 'Zor zamanında yanında olduğumu bilmeni isterim; her şeyin güzel olacağına inanıyorum.',
    genel: 'Sana kalpten gelen güzel bir dilek bırakmak istedim; umarım yüzünde tatlı bir tebessüm olur.',
  };

  const mediumByPurpose: Record<NotePurpose, string> = {
    ozur:
      'Seni kırdığım için gerçekten çok üzgünüm. Kalbini onarmak ve güvenini yeniden kazanmak için daha dikkatli, daha özenli olacağım.',
    tesekkur:
      'Varlığınla hayatıma kattığın tüm güzellikler için sana içtenlikle teşekkür ederim. İyi ki hayatımdasın.',
    kutlama:
      'Bu özel gününü tüm kalbimle kutluyorum. Hayatının her anı sağlık, huzur ve mutlulukla dolsun.',
    sevgi:
      'Sana olan sevgimi anlatmaya kelimeler yetmiyor. İyi ki varsın ve iyi ki kalbimin en güzel yerindesin.',
    destek:
      'Şu an zor görünse de yanında olduğumu bilmeni isterim. Birlikte her şeyin üstesinden gelebileceğimize inanıyorum.',
    genel:
      'Bu çiçeklerle birlikte sana içten bir selam ve güzel dileklerimi gönderiyorum. Gününün huzurla ve mutlulukla geçmesini dilerim.',
  };

  const longByPurpose: Record<NotePurpose, string> = {
    ozur:
      'Seni kırdığım için içtenlikle özür diliyorum. Yaptığım hatanın farkındayım ve bunu telafi etmek için daha anlayışlı, daha özenli olacağıma söz veriyorum. Kalbini yeniden kazanmak benim için çok kıymetli.',
    tesekkur:
      'Hayatıma kattığın her güzel duygu için sana ne kadar teşekkür etsem az. Varlığın bana güç veriyor ve her günü daha anlamlı kılıyor. İyi ki varsın, iyi ki yanımdasın.',
    kutlama:
      'Bugün senin için çok güzel bir başlangıç olsun. Başarılarının, neşenin ve huzurunun her geçen gün artmasını diliyorum. Kalbinin istediği her şey en doğru zamanda gerçekleşsin.',
    sevgi:
      'Sana duyduğum sevgiyi her gün yeniden hissediyorum. Varlığın bana huzur, gülüşün bana umut oluyor. İyi ki kalbimin en güzel yerindesin ve iyi ki hayatımdasın.',
    destek:
      'Bu süreçte kendini yalnız hissetmeni istemem. Her adımda yanında olduğumu, seni anladığımı ve sana inandığımı bilmeni isterim. Güzel günler düşündüğünden daha yakın.',
    genel:
      'Sana bu çiçeklerle birlikte içten bir selam ve güzel dileklerimi göndermek istedim. Umarım günün keyifle geçer, yüzünde tatlı bir gülümseme olur. Hayat sana hep iyi sürprizler getirsin.',
  };

  const toneSuffix: Partial<Record<AINoteTone, string>> = {
    romantik: ' Kalbimdeki yerin çok özel.',
    eglenceli: ' Biraz neşe, biraz mutluluk da yanında olsun!'
  };

  const base = length === 'kisa' ? shortByPurpose[purpose] : length === 'uzun' ? longByPurpose[purpose] : mediumByPurpose[purpose];
  return `${base}${toneSuffix[tone] ?? ''}`.trim();
}

export function generateAINote(input: AINoteInput): string {
  const intent = cleanIntent(input.intent);
  const recipient = (input.recipient ?? '').trim();
  const purpose = detectPurpose(intent);
  const baseSeed = (intent.length + recipient.length + input.tone.length + input.length.length + purpose.length) * 13;
  const seed = baseSeed + Math.abs(input.variantSeed ?? 0);

  const opener = pick(OPENERS[input.tone], seed);
  const closer = pick(CLOSERS[input.tone], seed + 7);

  const body = buildBody(purpose, input.tone, input.length);

  if (input.tone === 'resmi' && !opener.endsWith(',')) {
    return `${opener} ${recipient || 'müşterimiz'}, ${body} ${closer}`.replace(/\s+/g, ' ').trim();
  }

  if (recipient) {
    return `${opener} ${recipient}, ${body} ${closer}`.replace(/\s+/g, ' ').trim();
  }

  return `${opener} ${body} ${closer}`.replace(/\s+/g, ' ').trim();
}
