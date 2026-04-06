import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-4',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent/60 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-xl font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Button className="mt-6" asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
