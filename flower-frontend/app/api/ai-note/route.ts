import { NextRequest, NextResponse } from 'next/server';

type Tone = 'romantik' | 'samimi' | 'resmi' | 'eglenceli';
type Length = 'kisa' | 'orta' | 'uzun';

type Payload = {
  intent?: string;
  recipient?: string;
  tone?: Tone;
  length?: Length;
};

function normalizeTone(value: unknown): Tone {
  if (value === 'romantik' || value === 'resmi' || value === 'eglenceli') return value;
  return 'samimi';
}

function normalizeLength(value: unknown): Length {
  if (value === 'kisa' || value === 'uzun') return value;
  return 'orta';
}

function buildPrompt(input: { intent: string; recipient: string; tone: Tone; length: Length }) {
  return [
    'Bir çiçek kartı notu yaz.',
    'Dil: Türkçe.',
    `Ton: ${input.tone}.`,
    `Uzunluk: ${input.length}.`,
    `Mesaj amacı: ${input.intent}.`,
    `Alıcı: ${input.recipient || 'belirtilmedi'}.`,
    'Kurallar:',
    '- Sadece not metnini döndür, açıklama yapma.',
    '- Kullanıcının ham metnini doğrudan kopyalama; zarif ve doğal bir dille yeniden yaz.',
    '- Suçlayıcı, kaba veya kırıcı ifade kullanma.',
    '- En fazla 3 cümle olsun.',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  let body: Payload;

  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ message: 'Geçersiz istek gövdesi' }, { status: 400 });
  }

  const intent = (body.intent ?? '').trim();
  const recipient = (body.recipient ?? '').trim();
  const tone = normalizeTone(body.tone);
  const length = normalizeLength(body.length);

  if (!intent) {
    return NextResponse.json({ message: 'Mesaj amacı zorunludur' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  if (!apiKey) {
    return NextResponse.json(
      { message: 'Yapay zekâ servis anahtarı tanımlı değil', code: 'AI_NOT_CONFIGURED' },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content:
              'Türkçe, doğal ve zarif çiçek kartı notları üret. Kullanıcının ham metnini kopyalama, yeniden yaz. Sadece düz metin döndür.',
          },
          {
            role: 'user',
            content: buildPrompt({ intent, recipient, tone, length }),
          },
        ],
      }),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { message: 'Yapay zekâ servisinden yanıt alınamadı', code: 'AI_UPSTREAM_ERROR' },
        { status: 502 },
      );
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const note = data.choices?.[0]?.message?.content?.trim() ?? '';

    if (!note) {
      return NextResponse.json(
        { message: 'Yapay zekâ not üretemedi', code: 'AI_EMPTY_RESPONSE' },
        { status: 502 },
      );
    }

    return NextResponse.json({ note, provider: 'openai' });
  } catch {
    return NextResponse.json(
      { message: 'Yapay zekâ servisine şu anda ulaşılamıyor', code: 'AI_NETWORK_ERROR' },
      { status: 502 },
    );
  }
}
