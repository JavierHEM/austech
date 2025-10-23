'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useUniversalPersistence } from '@/hooks/use-universal-persistence';

// Crear el contexto
const UniversalPersistenceContext = createContext<ReturnType<typeof useUniversalPersistence> | undefined>(undefined);

/**
 * Provider que hace disponible el hook de persistencia universal
 */
export function UniversalPersistenceProvider({ children }: { children: React.ReactNode }) {
  const persistence = useUniversalPersistence();
  const pathname = usePathname();

  useEffect(() => {
    // Mostrar indicador de que la persistencia está activa (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
    }
  }, [pathname]);

  return (
    <UniversalPersistenceContext.Provider value={persistence}>
      {children}
      
      {/* Indicador visual de persistencia activa (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="fixed bottom-4 right-4 bg-green-100 text-green-800 text-xs px-2 py-1 rounded shadow-lg z-50"
          style={{ fontSize: '10px' }}
        >
          💾 Persistencia activa
        </div>
      )}
    </UniversalPersistenceContext.Provider>
  );
}

/**
 * Hook para usar la persistencia universal
 */
export function usePersistence() {
  const context = useContext(UniversalPersistenceContext);
  if (context === undefined) {
    throw new Error('usePersistence must be used within a UniversalPersistenceProvider');
  }
  return context;
}

/**
 * Hook simplificado para persistir estado de página
 * Uso: const [state, setState] = usePageState('myKey', defaultValue);
 */
export function usePageState(key: string, defaultValue: any) {
  const { usePageState: usePersistentState } = usePersistence();
  return usePersistentState(key, defaultValue);
}

/**
 * Hook simplificado para persistir formularios
 * Uso: const { formData, updateField, resetForm } = usePageForm('myForm', initialValues);
 */
export function usePageForm(formKey: string, initialValues: any) {
  const { usePageForm: usePersistentForm } = usePersistence();
  return usePersistentForm(formKey, initialValues);
}

/**
 * Hook para obtener información sobre el estado de persistencia
 */
export function usePersistenceStatus() {
  const { clearAllState } = usePersistence();
  const pathname = usePathname();

  return {
    isLoaded: true,
    currentPath: pathname,
    clearAllData: clearAllState,
    hasPersistedData: () => {
      try {
        const keys = Object.keys(localStorage);
        return keys.some(key => key.startsWith(`persistence-${pathname}-`));
      } catch {
        return false;
      }
    }
  };
}
