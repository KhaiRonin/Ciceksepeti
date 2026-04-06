export type OccasionKey =
  | 'valentines-day'
  | 'mothers-day'
  | 'womens-day'
  | 'fathers-day'
  | 'teachers-day'
  | 'anniversary'
  | 'birthday'
  | 'new-baby'
  | 'congratulations'
  | 'get-well'
  | 'sympathy';

export const OCCASIONS: Array<{
  key: OccasionKey;
  title: string;
  subtitle: string;
}> = [
  {
    key: 'valentines-day',
    title: 'Sevgililer Günü',
    subtitle: 'Kırmızı gül, orkide ve romantik buket seçimleri',
  },
  {
    key: 'mothers-day',
    title: 'Anneler Günü',
    subtitle: 'Orkide, lilyum ve zarif pembe tonlar',
  },
  {
    key: 'womens-day',
    title: 'Kadınlar Günü',
    subtitle: 'Lale, karanfil ve canlı bahar aranjmanları',
  },
  {
    key: 'fathers-day',
    title: 'Babalar Günü',
    subtitle: 'Saksılı bitkiler ve sade, güçlü aranjmanlar',
  },
  {
    key: 'teachers-day',
    title: 'Öğretmenler Günü',
    subtitle: 'Orkide ve karanfil odaklı saygılı seçimler',
  },
  {
    key: 'anniversary',
    title: 'Yıldönümü',
    subtitle: 'Gül ve orkide ile klasik aşıklar konsepti',
  },
  {
    key: 'birthday',
    title: 'Doğum Günü',
    subtitle: 'Renkli, enerjik ve kutlama odakli buketler',
  },
  {
    key: 'new-baby',
    title: 'Yeni Bebek',
    subtitle: 'Yumuşak tonlar, beyaz çiçekler ve saf tasarımlar',
  },
  {
    key: 'congratulations',
    title: 'Tebrik',
    subtitle: 'Başarı, terfi ve yeni iş için premium seçimler',
  },
  {
    key: 'get-well',
    title: 'Geçmiş Olsun',
    subtitle: 'Moral veren canlı renkler ve ferah çiçekler',
  },
  {
    key: 'sympathy',
    title: 'Taziye',
    subtitle: 'Sade, beyaz ve sakin tonlu saygılı aranjmanlar',
  },
];

export type OccasionCurationRule = {
  include: string[];
  avoid?: string[];
  fallback?: string[];
};

export const OCCASION_CURATION_RULES: Record<OccasionKey, OccasionCurationRule> = {
  'valentines-day': {
    include: ['gül', 'kırmızı', 'aşk', 'romantik', 'kalp', 'sevgili'],
    avoid: ['taziye', 'çelenk', 'başsağlığı'],
    fallback: ['orkide', 'şakayık', 'buket'],
  },
  'mothers-day': {
    include: ['anne', 'anneler', 'lilyum', 'pembe', 'zarif', 'orkide'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['gerbera', 'papatya', 'buket'],
  },
  'womens-day': {
    include: ['kadın', 'mimoza', 'lale', 'bahar', 'renkli'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['gerbera', 'orkide', 'buket'],
  },
  'fathers-day': {
    include: ['baba', 'babalar', 'saksı', 'bonsai', 'bitki', 'minimal'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['orkide', 'lilyum', 'yeşil'],
  },
  'teachers-day': {
    include: ['öğretmen', 'öğretmenler', 'karanfil', 'teşekkür', 'masa'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['orkide', 'lilyum', 'buket'],
  },
  anniversary: {
    include: ['yıldönümü', 'romantik', 'gül', 'çift', 'aşk'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['orkide', 'lilyum', 'buket'],
  },
  birthday: {
    include: ['doğum günü', 'kutlama', 'renkli', 'neşeli', 'ayıcık', 'mix'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['gerbera', 'papatya', 'lale'],
  },
  'new-baby': {
    include: ['bebek', 'hoş geldin', 'pastel', 'beyaz', 'yumuşak'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['papatya', 'lilyum', 'orkide'],
  },
  congratulations: {
    include: ['tebrik', 'başarı', 'mezuniyet', 'terfi', 'açılış'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['orkide', 'lilyum', 'premium'],
  },
  'get-well': {
    include: ['geçmiş olsun', 'moral', 'ferah', 'canlı', 'sağlık'],
    avoid: ['taziye', 'çelenk'],
    fallback: ['papatya', 'gerbera', 'lilyum'],
  },
  sympathy: {
    include: ['taziye', 'çelenk', 'başsağlığı', 'vefat', 'anma'],
    fallback: ['beyaz', 'lilyum', 'karanfil'],
  },
};
