// src/routes/tipoSierra.routes.js
import { Router } from 'express';
import { validateToken, checkRole } from '../middleware/auth.middleware.js';
import {
 getTiposSierra,
 getTipoSierra,
 createTipoSierra,
 updateTipoSierra,
 deleteTipoSierra
} from '../controllers/tipoSierra.controller.js';

const router = Router();

router.get('/', validateToken, getTiposSierra);
router.get('/:id', validateToken, getTipoSierra);
router.post('/', [validateToken, checkRole(['GERENTE'])], createTipoSierra);
router.put('/:id', [validateToken, checkRole(['GERENTE'])], updateTipoSierra);
router.delete('/:id', [validateToken, checkRole(['GERENTE'])], deleteTipoSierra);

export default router;