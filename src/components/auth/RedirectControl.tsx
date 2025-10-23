'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Contexto para controlar el comportamiento de redirección
interface RedirectControlContextType {
  isRedirectEnabled: boolean;
  setRedirectEnabled: (enabled: boolean) => void;
  currentPath: string;
  setCurrentPath: (path: string) => void;
  shouldPreventRedirect: (path: string) => boolean;
}

const RedirectControlContext = createContext<RedirectControlContextType | undefined>(undefined);

// Provider para el control de redirección
export function RedirectControlProvider({ children }: { children: ReactNode }) {
  const [isRedirectEnabled, setIsRedirectEnabled] = useState(true);
  const [currentPath, setCurrentPath] = useState('');

  // Rutas que no deberían causar redirección automática
  const protectedPaths = [
    '/reportes',
    '/afilados',
    '/sierras',
    '/empresas',
    '/usuarios',
    '/sucursales',
  ];

  // Función para determinar si se debe prevenir la redirección
  const shouldPreventRedirect = (path: string) => {
    // Si las redirecciones están deshabilitadas globalmente
    if (!isRedirectEnabled) {
      return true;
    }

    // Si la ruta actual está en la lista de rutas protegidas
    return protectedPaths.some(protectedPath => path.startsWith(protectedPath));
  };

  // Actualizar la ruta actual cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);

  const value: RedirectControlContextType = {
    isRedirectEnabled,
    setRedirectEnabled: setIsRedirectEnabled,
    currentPath,
    setCurrentPath,
    shouldPreventRedirect,
  };

  return (
    <RedirectControlContext.Provider value={value}>
      {children}
    </RedirectControlContext.Provider>
  );
}

// Hook para usar el control de redirección
export function useRedirectControl() {
  const context = useContext(RedirectControlContext);
  if (context === undefined) {
    throw new Error('useRedirectControl must be used within a RedirectControlProvider');
  }
  return context;
}

// Componente para mostrar el estado del control de redirección
export function RedirectControlStatus() {
  const { isRedirectEnabled, currentPath, shouldPreventRedirect } = useRedirectControl();
  
  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const isProtected = shouldPreventRedirect(currentPath);

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg text-xs z-50">
      <div className="space-y-1">
        <div className="font-semibold text-gray-800">Control de Redirección</div>
        <div className={`px-2 py-1 rounded text-white text-xs ${
          isRedirectEnabled ? 'bg-green-500' : 'bg-red-500'
        }`}>
          Redirecciones: {isRedirectEnabled ? 'Habilitadas' : 'Deshabilitadas'}
        </div>
        <div className={`px-2 py-1 rounded text-white text-xs ${
          isProtected ? 'bg-blue-500' : 'bg-gray-500'
        }`}>
          Ruta protegida: {isProtected ? 'Sí' : 'No'}
        </div>
        <div className="text-gray-600 truncate max-w-48">
          Ruta: {currentPath}
        </div>
      </div>
    </div>
  );
}

// Componente para controlar manualmente las redirecciones
export function RedirectControlPanel() {
  const { isRedirectEnabled, setRedirectEnabled, currentPath, shouldPreventRedirect } = useRedirectControl();
  
  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const isProtected = shouldPreventRedirect(currentPath);

  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Panel de Control de Redirección</h3>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="redirect-enabled"
                checked={isRedirectEnabled}
                onChange={(e) => setRedirectEnabled(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="redirect-enabled" className="text-sm text-yellow-700">
                Habilitar redirecciones automáticas
              </label>
            </div>
            <div className="text-sm text-yellow-700">
              <p><strong>Estado actual:</strong></p>
              <p>• Redirecciones: {isRedirectEnabled ? 'Habilitadas' : 'Deshabilitadas'}</p>
              <p>• Ruta actual: {currentPath}</p>
              <p>• Protegida: {isProtected ? 'Sí' : 'No'}</p>
            </div>
            <div className="text-xs text-yellow-600">
              <p>Las redirecciones automáticas están deshabilitadas en rutas de formularios para evitar interrupciones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
