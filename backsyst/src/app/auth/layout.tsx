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
        @keyframes pageSlideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pageSlideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .page-transition {
          animation: pageSlideInRight 0.4s ease-out forwards;
        }

        .page-transition.transition-left {
          animation: pageSlideInLeft 0.4s ease-out forwards;
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
