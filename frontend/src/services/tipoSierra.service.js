// frontend/src/services/tipoSierra.service.js
import axios from '../utils/axios';

export const getTiposSierra = async () => {
  const response = await axios.get('/tipos-sierra');
  return response.data;
};

export const getTipoSierra = async (id) => {
  const response = await axios.get(`/tipos-sierra/${id}`);
  return response.data;
};

export const createTipoSierra = async (data) => {
  const response = await axios.post('/tipos-sierra', data);
  return response.data;
};

export const updateTipoSierra = async ({ id, ...data }) => {
  const response = await axios.put(`/tipos-sierra/${id}`, data);
  return response.data;
};

export const deleteTipoSierra = async (id) => {
  const response = await axios.delete(`/tipos-sierra/${id}`);
  return response.data;
};