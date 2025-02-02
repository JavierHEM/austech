// backend/src/routes/auth.routes.js
// src/routes/auth.routes.js
import { Router } from 'express';
import { validateToken, checkRole } from '../middleware/auth.middleware.js';
import { login, validateToken as authValidate, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.get('/validate', validateToken, authValidate);
router.post('/register', [validateToken, checkRole(['GERENTE'])], register);

export default router;