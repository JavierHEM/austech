// src/routes/sierra.routes.js
import { Router } from 'express';
import { validateToken, checkRole } from '../middleware/auth.middleware.js';
import {
  getSierras,
  getSierra,
  getSierraPorCodigo,
  createSierra,
  updateSierra,
  deleteSierra,
  getSierrasBySucursal
} from '../controllers/sierra.controller.js';

const router = Router();

router.get('/codigo/:codigo', validateToken, getSierraPorCodigo);
router.get('/sucursal/:sucursalId', validateToken, getSierrasBySucursal);
router.get('/', validateToken, getSierras);
router.get('/:id', validateToken, getSierra);
router.post('/', [validateToken, checkRole(['GERENTE', 'JEFE_SUCURSAL'])], createSierra);
router.put('/:id', [validateToken, checkRole(['GERENTE', 'JEFE_SUCURSAL'])], updateSierra);
router.delete('/:id', [validateToken, checkRole(['GERENTE'])], deleteSierra);

export default router;