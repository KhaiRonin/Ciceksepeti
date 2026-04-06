'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta giriniz'),
    password: z
      .string()
      .min(8, 'Şifre en az 8 karakter olmalıdır')
      .regex(/[A-Za-z]/, 'En az bir harf içermelidir')
      .regex(/[0-9]/, 'En az bir rakam içermelidir'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterForm) {
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password });
    } catch (err: unknown) {
      const apiData = (err as any)?.response?.data;
      const raw = apiData?.message;
      const msg: string =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
            ? raw.join(', ')
            : typeof raw === 'object' && raw !== null
              ? (raw.message ?? apiData?.error ?? 'Kayıt sırasında bir hata oluştu')
              : apiData?.error ?? 'Kayıt sırasında bir hata oluştu';
      toast.error(msg);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:text-left">
        <h1 className="font-serif text-3xl font-bold text-foreground">Hesap Oluştur</h1>
        <p className="mt-2 text-muted-foreground">
          Hızlı kayıt olun, alışverişe başlayın
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Ad Soyad</Label>
          <Input id="name" placeholder="Adınız Soyadınız" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" type="email" placeholder="ornek@eposta.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Şifre</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? 'text' : 'password'}
              placeholder="min. 8 karakter, harf ve rakam"
              {...register('password')}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kayıt oluşturuluyor...
            </>
          ) : (
            'Hesap Oluştur'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
