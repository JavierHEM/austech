'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  /**
   * Elemento a mostrar como fallback durante la hidratación
   * Si no se proporciona, se mostrará un div con un tamaño similar
   */
  fallback?: ReactNode;
  /**
   * Clases CSS para el fallback (si no se proporciona un fallback personalizado)
   */
  fallbackClassName?: string;
}

export default function ClientOnly({ 
  children, 
  fallback,
  fallbackClassName = "w-5 h-5"
}: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Si no se ha montado el componente, mostrar el fallback o un div con dimensiones similares
  if (!hasMounted) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <div className={fallbackClassName} aria-hidden="true" />;
  }

  return <>{children}</>;
}