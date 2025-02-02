// frontend/src/components/usuarios/UsuarioForm.jsx
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { createUsuario, updateUsuario } from '../../services/usuario.service';
import { getSucursales } from '../../services/sucursal.service';

const ROLES = [
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'JEFE_SUCURSAL', label: 'Jefe de Sucursal' },
  { value: 'OPERADOR', label: 'Operador' }
];

const UsuarioForm = ({ usuario = null, onClose }) => {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: usuario?.email || '',
      nombre: usuario?.nombre || '',
      password: '',
      rol: usuario?.rol || 'OPERADOR',
      sucursalId: usuario?.sucursal?.id || '',
      estado: usuario?.estado ?? true
    }
  });

  // Obtener lista de sucursales para el select
  const { data: sucursales = [] } = useQuery({
    queryKey: ['sucursales'],
    queryFn: getSucursales
  });

  const mutation = useMutation({
    mutationFn: usuario ? updateUsuario : createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios']);
      onClose();
    }
  });

  const onSubmit = async (data) => {
    try {
      if (usuario) {
        await mutation.mutateAsync({ id: usuario.id, ...data });
      } else {
        await mutation.mutateAsync(data);
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-dark-secondary rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b dark:border-dark-border">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {usuario ? 'Editar' : 'Nuevo'} Usuario
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-dark-text dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email', { 
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-accent text-gray-900 dark:text-white"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Nombre
            </label>
            <input
              type="text"
              {...register('nombre', { 
                required: 'El nombre es requerido',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' }
              })}
              className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-accent text-gray-900 dark:text-white"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre.message}</p>
            )}
          </div>

          {/* Contraseña */}
          {!usuario && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                Contraseña
              </label>
              <input
                type="password"
                {...register('password', { 
                  required: !usuario && 'La contraseña es requerida',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                })}
                className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-accent text-gray-900 dark:text-white"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Rol
            </label>
            <select
              {...register('rol', { required: 'El rol es requerido' })}
              className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-accent text-gray-900 dark:text-white"
            >
              {ROLES.map(rol => (
                <option key={rol.value} value={rol.value}>
                  {rol.label}
                </option>
              ))}
            </select>
            {errors.rol && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rol.message}</p>
            )}
          </div>

          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Sucursal
            </label>
            <select
              {...register('sucursalId', { required: 'La sucursal es requerida' })}
              className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-accent text-gray-900 dark:text-white"
            >
              <option value="">Seleccione una sucursal</option>
              {sucursales.map(sucursal => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
            {errors.sucursalId && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sucursalId.message}</p>
            )}
          </div>

          {/* Estado */}
          {usuario && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('estado')}
                  className="rounded border-gray-300 dark:border-dark-border text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-dark-text">Usuario activo</span>
              </label>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-dark-primary disabled:opacity-50"
            >
              {mutation.isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsuarioForm;