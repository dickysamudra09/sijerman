// app/layout.tsx
import '../styles/globals.css';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Si Jerman - Platform Pembelajaran Online Bahasa Jerman',
  description: 'Platform pembelajaran online terbaik untuk siswa Indonesia. Belajar dengan mudah dan menyenangkan.',
  keywords: ['pembelajaran online', 'course', 'pendidikan', 'siswa'],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log('User session:', session?.user);

  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
