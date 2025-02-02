// src/components/historial/RegistroAfiladoForm.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle } from 'lucide-react';
import axios from '../../utils/axios';

const TIPOS_AFILADO = [
  { value: 'LOMO', label: 'Afilado de Lomo' },
  { value: 'PECHO', label: 'Afilado de Pecho' },
  { value: 'COMPLETO', label: 'Afilado Completo' }
];

const RegistroAfiladoForm = ({ sierra, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      tipoAfilado: 'LOMO',
      observaciones: '',
      esUltimoAfilado: false
    }
  });

  const esUltimoAfilado = watch('esUltimoAfilado');

  const mutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/historial', {
        ...data,
        sierraId: sierra.id
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['historial']);
      queryClient.invalidateQueries(['sierras']);
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Error al registrar el afilado');
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-secondary rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registrar Afilado - {sierra.codigo}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(mutation.mutate)} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Afilado
            </label>
            <select
              {...register('tipoAfilado')}
              className="w-full rounded-lg border border-gray-300"
            >
              {TIPOS_AFILADO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              {...register('observaciones')}
              rows={3}
              className="w-full rounded-lg border border-gray-300"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('esUltimoAfilado')}
              id="esUltimoAfilado"
              className="rounded border-gray-300"
            />
            <label htmlFor="esUltimoAfilado" className="ml-2 text-sm text-gray-700">
              Marcar como último afilado
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isLoading ? 'Registrando...' : 'Registrar Afilado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistroAfiladoForm;