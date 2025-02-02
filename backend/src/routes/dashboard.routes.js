// backend/src/routes/dashboard.routes.js
import { Router } from 'express';
import { validateToken } from '../middleware/auth.middleware.js';
import {
  getDashboardData,
  getDashboardBySucursal
} from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/', validateToken, getDashboardData);
router.get('/sucursal/:sucursalId', validateToken, getDashboardBySucursal);

export default router;