// backend/src/routes/historial.routes.js
import { Router } from 'express';
import { validateToken } from '../middleware/auth.middleware.js';
import {
  getBySierraId, // Cambiar getHistorialBySierra por getBySierraId
  getHistorialBySucursal,
  createRegistroAfilado
} from '../controllers/historial.controller.js';

const router = Router();

router.get('/sierra/:sierraId', validateToken, getBySierraId);
router.get('/sucursal/:sucursalId', validateToken, getHistorialBySucursal);
router.post('/', validateToken, createRegistroAfilado);

export default router;