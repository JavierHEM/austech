'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir automáticamente a la página de login después de 3 segundos
    const timer = setTimeout(() => {
      router.push('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirigiendo a Austech Sistema...</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Por favor espere un momento
        </p>
        <div className="mt-4 animate-pulse">
          <div className="h-2 w-24 bg-blue-500 rounded mx-auto"></div>
        </div>
      </div>
    </main>
  );
}
