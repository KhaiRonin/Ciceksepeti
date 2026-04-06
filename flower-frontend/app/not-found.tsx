import Link from 'next/link';
import { Flower, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/50">
            <Flower className="h-12 w-12 text-primary/60" />
          </div>
        </div>
        <h1 className="font-serif text-8xl font-bold text-primary/30 mb-4">404</h1>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-3">
          Sayfa Bulunamadı
        </h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç oluşturulmamış olabilir.
        </p>
        <Button asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
        </Button>
      </div>
    </div>
  );
}
