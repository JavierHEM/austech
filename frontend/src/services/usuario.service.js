// frontend/src/services/usuario.service.js
import axios from '../utils/axios';

export const getUsuarios = async () => {
  const response = await axios.get('/usuarios');
  return response.data;
};

export const getUsuario = async (id) => {
  const response = await axios.get(`/usuarios/${id}`);
  return response.data;
};

export const createUsuario = async (data) => {
  const response = await axios.post('/usuarios', data);
  return response.data;
};

export const updateUsuario = async ({ id, ...data }) => {
  const response = await axios.put(`/usuarios/${id}`, data);
  return response.data;
};

export const deleteUsuario = async (id) => {
  const response = await axios.delete(`/usuarios/${id}`);
  return response.data;
};