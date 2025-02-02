// frontend/src/services/historial.service.js
import axios from '../utils/axios';

// Constantes para tipos de afilado
export const TIPOS_AFILADO = [
  { value: 'LOMO', label: 'Lomo' },
  { value: 'PECHO', label: 'Pecho' },
  { value: 'COMPLETO', label: 'Completo' }
];

// Obtener historial por sucursal
export const getHistorialBySucursal = async (sucursalId) => {
  try {
    const response = await axios.get(`/historial/sucursal/${sucursalId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    throw error;
  }
};

// Buscar sierra por código
export const getSierraPorCodigo = async (codigo) => {
  try {
    const response = await axios.get(`/sierras/codigo/${codigo}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Sierra no encontrada');
    }
    throw error;
  }
};

// Registrar afilado
export const createRegistroAfilado = async (data) => {
  try {
    const response = await axios.post('/historial', data);
    return response.data;
  } catch (error) {
    console.error('Error al registrar afilado:', error);
    throw error;
  }
};

// Formatear fecha para mostrar
export const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};