import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PersistenceContextType {
  saveState: (key: string, value: any) => void;
  loadState: (key: string, defaultValue: any) => any;
  clearState: (key: string) => void;
  clearAllState: () => void;
  usePageState: (key: string, defaultValue: any) => readonly [any, React.Dispatch<any>, () => void];
  usePageForm: (formKey: string, initialValues: any) => {
    formData: any;
    updateField: (field: string, value: any) => void;
    updateMultipleFields: (updates: Record<string, any>) => void;
    resetForm: () => void;
    clearFormData: () => void;
  };
}

export function useUniversalPersistence(): PersistenceContextType {
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);

  const getStorageKey = useCallback((key: string) => {
    return `persistence-${pathname}-${key}`;
  }, [pathname]);

  const saveState = useCallback((key: string, value: any) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(value));
      } catch (error) {
        console.error('Error saving state to localStorage:', error);
      }
    }
  }, [getStorageKey]);

  const loadState = useCallback((key: string, defaultValue: any) => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(getStorageKey(key));
        return savedState ? JSON.parse(savedState) : defaultValue;
      } catch (error) {
        console.error('Error loading state from localStorage:', error);
        return defaultValue;
      }
    }
    return defaultValue;
  }, [getStorageKey]);

  const clearState = useCallback((key: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(getStorageKey(key));
      } catch (error) {
        console.error('Error clearing state from localStorage:', error);
      }
    }
  }, [getStorageKey]);

  const clearAllState = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        // Iterar sobre todas las claves y eliminar las que pertenecen a esta ruta
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`persistence-${pathname}-`)) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn('Error clearing all state from localStorage:', error);
      }
    }
  }, [pathname]);

  // Hook para manejar estado persistente
  const usePageState = (key: string, defaultValue: any) => {
    const [state, setState] = useState(defaultValue);
    const isInitialized = useRef(false);

    // Cargar estado inicial (solo una vez)
    useEffect(() => {
      if (!isInitialized.current) {
        const savedState = loadState(key, defaultValue);
        setState(savedState);
        setIsLoaded(true);
        isInitialized.current = true;
      }
    }, [key, defaultValue]);

    // Guardar estado cuando cambie (solo después de la inicialización)
    useEffect(() => {
      if (isInitialized.current && isLoaded) {
        saveState(key, state);
      }
    }, [key, state, isLoaded]);

    const clearThisState = useCallback(() => {
      clearState(key);
    }, [key, clearState]);

    return [state, setState, clearThisState] as const;
  };

  // Hook para manejar formularios persistentes
  const usePageForm = (formKey: string, initialValues: any) => {
    const [formData, setFormData, clearFormData] = usePageState(formKey, initialValues);

    const updateField = useCallback((field: string, value: any) => {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value
      }));
    }, [setFormData]);

    const updateMultipleFields = useCallback((updates: Record<string, any>) => {
      setFormData((prev: any) => ({
        ...prev,
        ...updates
      }));
    }, [setFormData]);

    const resetForm = useCallback(() => {
      setFormData(initialValues);
    }, [setFormData, initialValues]);

    return {
      formData,
      updateField,
      updateMultipleFields,
      resetForm,
      clearFormData
    };
  };

  return {
    saveState,
    loadState,
    clearState,
    clearAllState,
    usePageState,
    usePageForm,
  };
}