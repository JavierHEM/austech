// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

const AuthContext = createContext();

const ROLES = {
 GERENTE: ['GERENTE'],
 JEFE_SUCURSAL: ['GERENTE', 'JEFE_SUCURSAL'],
 OPERADOR: ['GERENTE', 'JEFE_SUCURSAL', 'OPERADOR']
};

export function AuthProvider({ children }) {
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   checkAuth();
 }, []);

 const signin = async (email, password) => {
   try {
     const { data } = await axios.post('/auth/login', { email, password });
     localStorage.setItem('token', data.token);
     setUser(data.user);
   } catch (error) {
     throw error.response?.data?.message || 'Error de autenticación';
   }
 };

 const signout = () => {
   localStorage.removeItem('token');
   setUser(null);
 };

 const checkAuth = async () => {
   try {
     const token = localStorage.getItem('token');
     if (!token) throw new Error('No token');

     const { data } = await axios.get('/auth/validate');
     setUser(data);
   } catch (error) {
     localStorage.removeItem('token');
   } finally {
     setLoading(false);
   }
 };

 const hasPermission = (requiredRoles) => {
   if (!user) return false;
   if (!requiredRoles) return true;
   return ROLES[user.rol].some(rol => requiredRoles.includes(rol));
 };

 return (
   <AuthContext.Provider value={{
     user,
     loading,
     signin,
     signout,
     hasPermission,
   }}>
     {children}
   </AuthContext.Provider>
 );
}

export const useAuth = () => {
 const context = useContext(AuthContext);
 if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
 return context;
};