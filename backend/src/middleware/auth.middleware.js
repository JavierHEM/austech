// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';

export const validateToken = (req, res, next) => {
 try {
   const token = req.headers.authorization?.split(' ')[1];
   if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

   const decoded = jwt.verify(token, process.env.JWT_SECRET);
   req.user = decoded;
   next();
 } catch (error) {
   return res.status(401).json({ message: 'Token inválido' });
 }
};

export const checkRole = (roles) => {
 return (req, res, next) => {
   if (!roles.includes(req.user.rol)) {
     return res.status(403).json({ message: 'No tiene permisos para esta acción' });
   }
   next();
 };
};