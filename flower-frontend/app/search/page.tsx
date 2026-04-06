import { redirect } from 'next/navigation';

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  const q = params.q;
  const search = Array.isArray(q) ? q[0] : q;
  if (search && search.trim()) {
    query.set('search', search.trim());
  }

  const nextUrl = query.toString() ? `/products?${query.toString()}` : '/products';
  redirect(nextUrl);
}
