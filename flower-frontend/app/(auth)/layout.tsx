import Link from 'next/link';
import { Flower } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Flower className="h-8 w-8" />
            </div>
            <span className="font-serif text-3xl font-semibold text-foreground">Kıbrısçiçeksepetim</span>
          </Link>
          <h2 className="font-serif text-4xl font-bold text-foreground mb-4 leading-tight">
            Her anı<br />güzelleştiriyoruz
          </h2>
          <p className="text-muted-foreground text-lg max-w-sm">
            En taze çiçekler, özel tasarım buketler ve sevdiklerinize özel hediyeler.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/10" />
        <div className="absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-primary/8" />
        <div className="absolute top-1/2 right-8 h-32 w-32 rounded-full bg-primary/6" />
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 bg-background">
        {children}
      </div>
    </div>
  );
}
