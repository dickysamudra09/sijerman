// @ts-nocheck
// app/layout.tsx
import '../styles/globals.css';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Si Jerman - Platform Pembelajaran Online Bahasa Jerman',
  description: 'Platform pembelajaran online terbaik untuk siswa Indonesia. Belajar dengan mudah dan menyenangkan.',
  keywords: ['pembelajaran online', 'course', 'pendidikan', 'siswa'],
};

// Disable zoom on mobile for professional look
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  
  // Only try to get session if environment variables are available
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createServerComponentClient({ cookies });
      const { data } = await supabase.auth.getSession();
      session = data.session;
      console.log('User session:', session?.user);
    } catch (error) {
      console.error('Error getting session:', error);
    }
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
