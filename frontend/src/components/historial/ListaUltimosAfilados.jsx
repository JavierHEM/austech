// src/components/historial/ListaUltimosAfilados.jsx
import { useState } from 'react';
import { Calendar, User, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TIPOS_AFILADO = [
  { value: 'LOMO', label: 'Lomo' },
  { value: 'PECHO', label: 'Pecho' },
  { value: 'COMPLETO', label: 'Completo' }
];

const ListaUltimosAfilados = ({ registros = [] }) => {
  const { user } = useAuth();
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Obtener lista única de sucursales usando un objeto como intermediario
  const sucursalesUnicas = Object.values(
    registros.reduce((acc, registro) => {
      const sucursal = registro.sierra?.sucursal;
      if (sucursal && sucursal.id) {
        acc[sucursal.id] = {
          id: sucursal.id,
          nombre: sucursal.nombre
        };
      }
      return acc;
    }, {})
  ).sort((a, b) => a.nombre.localeCompare(b.nombre));

  const registrosFiltrados = registros.filter(registro => {
    // Aplicar filtro de tipo
    if (filtroTipo && registro.tipoAfilado !== filtroTipo) return false;
    
    // Aplicar filtro de sucursal
    if (filtroSucursal && registro.sierra?.sucursalId?.toString() !== filtroSucursal) return false;
    
    // Aplicar filtro de fecha inicio
    if (fechaInicio && new Date(registro.fecha) < new Date(fechaInicio)) return false;
    
    // Aplicar filtro de fecha fin
    if (fechaFin && new Date(registro.fecha) > new Date(fechaFin)) return false;
    
    return true;
  });

  return (
    <div className="mt-8">
      <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Últimos Registros
          </h2>
          
          <div className="flex flex-wrap gap-4">
            {user?.rol === 'GERENTE' && sucursalesUnicas.length > 0 && (
              <select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
              >
                <option value="">Todas las sucursales</option>
                {sucursalesUnicas.map(sucursal => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_AFILADO.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
              placeholder="Fecha inicio"
            />

            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-3 py-1 border rounded-lg text-sm bg-white dark:bg-dark-accent"
              placeholder="Fecha fin"
            />
          </div>
        </div>

        <div className="space-y-4">
          {registrosFiltrados.length > 0 ? (
            registrosFiltrados.map((registro) => (
              <div 
                key={registro.id}
                className="border dark:border-dark-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-dark-accent transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {registro.sierra?.codigo} - {registro.sierra?.tipoSierra?.nombre}
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(registro.fecha).toLocaleString()}
                      </span>
                      {registro.usuario?.nombre && (
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {registro.usuario.nombre}
                        </span>
                      )}
                      {user?.rol === 'GERENTE' && registro.sierra?.sucursal?.nombre && (
                        <span className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1" />
                          {registro.sierra.sucursal.nombre}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${registro.tipoAfilado === 'LOMO' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : registro.tipoAfilado === 'PECHO'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }
                  `}>
                    {registro.tipoAfilado}
                  </span>
                </div>

                {registro.observaciones && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {registro.observaciones}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No se encontraron registros
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListaUltimosAfilados;