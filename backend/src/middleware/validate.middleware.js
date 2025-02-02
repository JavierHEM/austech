// backend/src/middleware/validate.middleware.js
export const validateRol = (roles) => {
    return (req, res, next) => {
      // Por ahora, para desarrollo, permitimos todas las peticiones
      // Más adelante implementaremos la validación real de roles
      next();
      
      /* Implementación real para producción:
      if (!req.user) {
        return res.status(401).json({ message: 'No autorizado' });
      }
  
      if (!roles.includes(req.user.rol)) {
        return res.status(403).json({ message: 'No tiene permiso para realizar esta acción' });
      }
  
      next();
      */
    };
  };