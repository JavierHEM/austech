// src/routes/usuario.routes.js
import { Router } from 'express';
import { validateToken, checkRole } from '../middleware/auth.middleware.js';
import {
  getUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario
} from '../controllers/usuario.controller.js';

const router = Router();

router.get('/', validateToken, getUsuarios);
router.get('/:id', validateToken, getUsuario);
router.post('/', [validateToken, checkRole(['GERENTE'])], createUsuario);
router.put('/:id', [validateToken, checkRole(['GERENTE'])], updateUsuario);
router.delete('/:id', [validateToken, checkRole(['GERENTE'])], deleteUsuario);

export default router;