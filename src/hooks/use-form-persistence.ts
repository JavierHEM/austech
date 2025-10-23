'use client';

import { useState, useEffect, useCallback } from 'react';

// Tipos para el estado persistente
interface FormState {
  [key: string]: any;
}

interface PersistentFormState {
  [formId: string]: {
    data: FormState;
    timestamp: number;
    url: string;
  };
}

// Hook para manejar la persistencia de formularios
export function useFormPersistence(formId: string, initialValues: FormState = {}) {
  const [formData, setFormData] = useState<FormState>(initialValues);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar datos persistentes al montar el componente
  useEffect(() => {
    const loadPersistentData = () => {
      try {
        const stored = localStorage.getItem('formPersistence');
        if (stored) {
          const persistentState: PersistentFormState = JSON.parse(stored);
          const formState = persistentState[formId];
          
          if (formState) {
            // Verificar que los datos no sean muy antiguos (máximo 24 horas)
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
            const isRecent = Date.now() - formState.timestamp < maxAge;
            
            // Solo cargar si los datos son recientes y la URL coincide
            if (isRecent && formState.url === window.location.pathname) {
              setFormData(formState.data);
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar datos persistentes:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadPersistentData();
  }, [formId]);

  // Función para guardar datos persistentes
  const savePersistentData = useCallback((data: FormState) => {
    try {
      const stored = localStorage.getItem('formPersistence');
      const persistentState: PersistentFormState = stored ? JSON.parse(stored) : {};
      
      persistentState[formId] = {
        data,
        timestamp: Date.now(),
        url: window.location.pathname,
      };
      
      localStorage.setItem('formPersistence', JSON.stringify(persistentState));
    } catch (error) {
      console.error('Error al guardar datos persistentes:', error);
    }
  }, [formId]);

  // Función para actualizar el estado del formulario
  const updateFormData = useCallback((newData: FormState) => {
    setFormData(newData);
    savePersistentData(newData);
  }, [savePersistentData]);

  // Función para limpiar datos persistentes
  const clearPersistentData = useCallback(() => {
    try {
      const stored = localStorage.getItem('formPersistence');
      if (stored) {
        const persistentState: PersistentFormState = JSON.parse(stored);
        delete persistentState[formId];
        localStorage.setItem('formPersistence', JSON.stringify(persistentState));
      }
      setFormData(initialValues);
    } catch (error) {
      console.error('Error al limpiar datos persistentes:', error);
    }
  }, [formId, initialValues]);

  // Función para limpiar todos los datos persistentes antiguos
  const cleanupOldData = useCallback(() => {
    try {
      const stored = localStorage.getItem('formPersistence');
      if (stored) {
        const persistentState: PersistentFormState = JSON.parse(stored);
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        const now = Date.now();
        
        // Eliminar datos antiguos
        Object.keys(persistentState).forEach(key => {
          if (now - persistentState[key].timestamp > maxAge) {
            delete persistentState[key];
          }
        });
        
        localStorage.setItem('formPersistence', JSON.stringify(persistentState));
      }
    } catch (error) {
      console.error('Error al limpiar datos antiguos:', error);
    }
  }, []);

  // Limpiar datos antiguos al montar
  useEffect(() => {
    cleanupOldData();
  }, [cleanupOldData]);

  return {
    formData,
    updateFormData,
    clearPersistentData,
    isLoaded,
  };
}

// Hook específico para formularios de reportes
export function useReportFormPersistence(formId: string, initialValues: FormState = {}) {
  const {
    formData,
    updateFormData,
    clearPersistentData,
    isLoaded,
  } = useFormPersistence(formId, initialValues);

  // Función para manejar cambios en campos específicos
  const handleFieldChange = useCallback((field: string, value: any) => {
    const newData = { ...formData, [field]: value };
    updateFormData(newData);
  }, [formData, updateFormData]);

  // Función para manejar múltiples cambios
  const handleMultipleChanges = useCallback((changes: Partial<FormState>) => {
    const newData = { ...formData, ...changes };
    updateFormData(newData);
  }, [formData, updateFormData]);

  // Función para resetear a valores iniciales
  const resetToInitial = useCallback(() => {
    updateFormData(initialValues);
  }, [updateFormData, initialValues]);

  return {
    formData,
    handleFieldChange,
    handleMultipleChanges,
    resetToInitial,
    clearPersistentData,
    isLoaded,
  };
}

// Utilidad para limpiar todos los datos persistentes
export function clearAllPersistentData() {
  try {
    localStorage.removeItem('formPersistence');
  } catch (error) {
    console.error('Error al limpiar todos los datos persistentes:', error);
  }
}

// Utilidad para obtener información sobre datos persistentes
export function getPersistentDataInfo() {
  try {
    const stored = localStorage.getItem('formPersistence');
    if (stored) {
      const persistentState: PersistentFormState = JSON.parse(stored);
      return Object.keys(persistentState).map(formId => ({
        formId,
        timestamp: persistentState[formId].timestamp,
        url: persistentState[formId].url,
        age: Date.now() - persistentState[formId].timestamp,
      }));
    }
  } catch (error) {
    console.error('Error al obtener información de datos persistentes:', error);
  }
  return [];
}
