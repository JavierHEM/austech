// backend/src/routes/reportes.routes.js
import { Router } from 'express';
import { validateToken } from '../middleware/auth.middleware.js';
import {
  getAfiladosPorSucursal,
  getAfiladosPorSierra,
  getAfiladosPorFecha,
  getEstadisticasGenerales,
  exportarAfiladosPorSucursal,
  exportarAfiladosPorSierra,
  exportarAfiladosPorFecha
} from '../controllers/reportes.controller.js';

const router = Router();

// Rutas para obtener datos
router.get('/afilados-sucursal', validateToken, getAfiladosPorSucursal);
router.get('/afilados-sierra', validateToken, getAfiladosPorSierra);
router.get('/afilados-fecha', validateToken, getAfiladosPorFecha);
router.get('/estadisticas', validateToken, getEstadisticasGenerales);

// Rutas para exportar
router.get('/afilados-sucursal/exportar', validateToken, exportarAfiladosPorSucursal);
router.get('/afilados-sierra/exportar', validateToken, exportarAfiladosPorSierra);
router.get('/afilados-fecha/exportar', validateToken, exportarAfiladosPorFecha);

export default router;