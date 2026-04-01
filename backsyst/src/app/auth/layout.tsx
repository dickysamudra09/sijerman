'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <style>{`
        .page-transition {
          /* Animations disabled */
        }

        .page-transition.transition-left {
          /* Animations disabled */
        }
      `}</style>
      <div 
        className={`page-transition ${
          pathname?.includes('register') ? 'transition-left' : ''
        }`} 
        key={pathname}
      >
        {children}
      </div>
    </>
  );
}
