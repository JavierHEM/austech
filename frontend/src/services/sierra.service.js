// src/services/sierra.service.js
import axios from '../utils/axios';

export const getSierras = async () => {
  const response = await axios.get('/sierras');
  return response.data;
};

export const getSierraPorCodigo = async (codigo) => {
  const response = await axios.get(`/sierras/codigo/${codigo}`);
  return response.data;
};

export const createSierra = async (data) => {
  const response = await axios.post('/sierras', data);
  return response.data;
};

export const updateSierra = async (id, data) => {
  const response = await axios.put(`/sierras/${id}`, data);
  return response.data;
};

export const deleteSierra = async (id) => {
  const response = await axios.delete(`/sierras/${id}`);
  return response.data;
};

export const getSierrasBySucursal = async (sucursalId) => {
  const response = await axios.get(`/sierras/sucursal/${sucursalId}`);
  return response.data;
};