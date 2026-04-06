'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
  className?: string;
}

function getUploadErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const serverMessage = maybeResponse?.data?.message;
    if (Array.isArray(serverMessage) && serverMessage.length > 0) {
      return serverMessage.join(', ');
    }
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Görsel yüklenemedi. Lütfen dosya türünü (PNG/JPG/WEBP) ve boyutu (maks. 5MB) kontrol edin.';
}

export function ImageUploader({ value, onChange, onUpload, className }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Local preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      setUploading(true);
      try {
        if (onUpload) {
          const uploadedUrl = await onUpload(file);
          setPreview(uploadedUrl);
          onChange(uploadedUrl);
          return;
        }
        onChange(objectUrl);
      } catch (error) {
        toast.error(getUploadErrorMessage(error));
        setPreview(value ?? null);
      } finally {
        setUploading(false);
      }
    },
    [onChange, onUpload, value],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setPreview(null);
    onChange('');
  }

  return (
    <div className={cn('relative', className)}>
      {preview ? (
        <div className="relative h-40 w-full rounded-lg overflow-hidden border border-border">
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 shadow-lg"
            onClick={handleRemove}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/20 transition-colors hover:bg-muted/40 hover:border-primary/40',
            isDragActive && 'border-primary bg-primary/5',
            uploading && 'opacity-60 pointer-events-none',
          )}
        >
          <input {...getInputProps()} />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {uploading ? (
              <Upload className="h-5 w-5 text-muted-foreground animate-bounce" />
            ) : isDragActive ? (
              <Upload className="h-5 w-5 text-primary" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            {uploading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : isDragActive ? (
              <p className="text-sm font-medium text-primary">Bırakın!</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  <span className="text-primary">Tıklayın</span> veya sürükleyip bırakın
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP · Maks. 5MB</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
