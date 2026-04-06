import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { ArrowRight, Truck, Shield, Headphones, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/common/ProductCard';
import { LOCALE_COOKIE_NAME, normalizeLocale } from '@/lib/i18n/config';
import { getSafeImageUrl, publicUploadSrc, shouldBypassImageOptimization } from '@/lib/utils';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

type HomeCategory = {
  id: string;
  name: string;
  imageUrl?: string;
  _count?: { products: number };
};

async function getHomeData(): Promise<{ products: Product[]; categories: HomeCategory[] }> {
  try {
    const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE_NAME)?.value);
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${BASE_URL}/products?limit=8&locale=${locale}`, { next: { revalidate: 60 } }),
      fetch(`${BASE_URL}/categories?locale=${locale}`, { next: { revalidate: 60 } }),
    ]);
    const productsJson = productsRes.ok ? await productsRes.json() : { data: [] };
    const categoriesJson = categoriesRes.ok ? await categoriesRes.json() : [];
    const products: Product[] = Array.isArray(productsJson?.data) ? productsJson.data : [];
    const categories: HomeCategory[] = Array.isArray(categoriesJson) ? categoriesJson : [];
    return { products, categories };
  } catch {
    return { products: [], categories: [] };
  }
}

const FEATURES = [
  { icon: Truck, title: 'Ücretsiz Teslimat', desc: '250 ₺ üzeri siparişlerde' },
  { icon: Leaf, title: 'Taze Garanti', desc: '7 gün tazelik garantisi' },
  { icon: Shield, title: 'Güvenli Ödeme', desc: '256-bit SSL şifrelemesi' },
  { icon: Headphones, title: '7/24 Destek', desc: 'Her zaman yanınızdayız' },
];

export default async function HomePage() {
  const { products, categories } = await getHomeData();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="text-primary border-primary/30 bg-primary/10 w-fit">
                Yeni Koleksiyon
              </Badge>
              <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight text-foreground">
                Sevginizi <br />
                <span className="text-primary">Çiçeklerle</span> <br />
                Anlatın
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                El işçiliğiyle hazırlanan lüks buketlerimiz ve en taze çiçeklerimizle her özel anı
                unutulmaz kılın.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Button size="lg" className="gap-2 px-8" asChild>
                  <Link href="/products">
                    Alışverişe Başla
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/categories/buket">Buketleri Gör</Link>
                </Button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="relative h-[480px] w-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-3xl" />
                <span className="text-[200px] select-none opacity-30 drop-shadow-lg">🌹</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/5 translate-y-1/3 -translate-x-1/4 pointer-events-none" />
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-12 border-y border-border/60 bg-secondary/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Kategoriler</p>
                <h2 className="font-serif text-3xl font-bold text-foreground">Koleksiyonlarımız</h2>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-primary">
                <Link href="/products">Tümü <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat) => {
                const imageSrc = publicUploadSrc(getSafeImageUrl(cat.imageUrl));

                return (
                  <Link
                    key={cat.id}
                    href={`/products?categoryId=${cat.id}`}
                    className="group relative overflow-hidden rounded-2xl aspect-square bg-white card-hover"
                  >
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={cat.name}
                        fill
                        className="object-cover object-[center_62%] transition-transform duration-300 group-hover:scale-100"
                        sizes="(max-width: 640px) 50vw, 25vw"
                        unoptimized={shouldBypassImageOptimization(imageSrc)}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-5xl">🌸</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-semibold text-sm">{cat.name}</p>
                      {cat._count && (
                        <p className="text-white/70 text-xs">{cat._count.products} ürün</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ─────────────────────────────────────── */}
      <section className="py-16 bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Öne Çıkanlar</p>
              <h2 className="font-serif text-3xl font-bold text-foreground">Popüler Ürünler</h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-primary">
              <Link href="/products">Tümünü Gör <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-5xl mb-4">🌱</p>
              <p>Yakında ürünler eklenecek...</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-12 md:p-16 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
              Sevdiklerinize Özel Bir Sürpriz
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-lg mx-auto">
              Doğum günü, yıl dönümü veya sadece &ldquo;seni düşünüyorum&rdquo; demek için en güzel çiçekler.
            </p>
            <Button size="lg" variant="secondary" className="font-semibold px-10 gap-2" asChild>
              <Link href="/products">
                Hemen Keşfet <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 pointer-events-none" />
          </div>
        </div>
      </section>
    </>
  );
}