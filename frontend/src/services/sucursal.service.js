// frontend/src/services/sucursal.service.js
import axios from '../utils/axios';

export const getSucursales = async () => {
  const response = await axios.get('/sucursales');
  return response.data;
};

export const getSucursal = async (id) => {
  const response = await axios.get(`/sucursales/${id}`);
  return response.data;
};

export const createSucursal = async (data) => {
  const response = await axios.post('/sucursales', data);
  return response.data;
};

export const updateSucursal = async ({ id, ...data }) => {
  const response = await axios.put(`/sucursales/${id}`, data);
  return response.data;
};

export const deleteSucursal = async (id) => {
  const response = await axios.delete(`/sucursales/${id}`);
  return response.data;
};