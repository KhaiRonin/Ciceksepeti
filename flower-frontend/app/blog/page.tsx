import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const POSTS = [
  {
    slug: 'cicek-bakimi-ipuclari',
    title: 'Çiçek Bakımı İçin 7 Pratik İpucu',
    excerpt: 'Buketinizi daha uzun süre canlı tutmak için günlük bakım önerileri.',
  },
  {
    slug: 'mevsime-gore-cicek-secimi',
    title: 'Mevsime Göre Çiçek Seçimi',
    excerpt: 'İlkbahar, yaz, sonbahar ve kış için en doğru çiçek önerileri.',
  },
  {
    slug: 'ozel-gun-cicek-onerileri',
    title: 'Özel Günler İçin Çiçek Önerileri',
    excerpt: 'Doğum günü, yıl dönümü ve kutlamalar için etkileyici alternatifler.',
  },
];

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">İçerikler</p>
        <h1 className="font-serif text-4xl font-bold text-foreground">Blog</h1>
        <p className="text-muted-foreground mt-2">Çiçekler, bakım ve hediye fikirleri.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {POSTS.map((post) => (
          <article key={post.slug} className="rounded-2xl border border-border/60 bg-card p-5 card-hover">
            <h2 className="text-lg font-semibold leading-snug">{post.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
            <Link href="/products" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Ürünlere Göz At
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
