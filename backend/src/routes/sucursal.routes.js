// src/routes/sucursal.routes.js
import { Router } from 'express';
import { validateToken, checkRole } from '../middleware/auth.middleware.js';
import { 
  getSucursales, 
  getSucursal, 
  createSucursal, 
  updateSucursal, 
  deleteSucursal 
} from '../controllers/sucursal.controller.js';

const router = Router();

router.get('/', validateToken, getSucursales);
router.get('/:id', validateToken, getSucursal);
router.post('/', [validateToken, checkRole(['GERENTE'])], createSucursal);
router.put('/:id', [validateToken, checkRole(['GERENTE'])], updateSucursal);
router.delete('/:id', [validateToken, checkRole(['GERENTE'])], deleteSucursal);

export default router;