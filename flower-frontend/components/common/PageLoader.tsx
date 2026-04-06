import { Flower } from 'lucide-react';

interface PageLoaderProps {
  text?: string;
}

export default function PageLoader({ text = 'Yükleniyor...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-spin border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Flower className="h-5 w-5 text-primary/60" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}
