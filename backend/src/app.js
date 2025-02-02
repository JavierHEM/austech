// backend/src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import sucursalRoutes from './routes/sucursal.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import tipoSierraRoutes from './routes/tipoSierra.routes.js';
import sierraRoutes from './routes/sierra.routes.js';
import historialRoutes from './routes/historial.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "austech-pcr1l663q-javierhems-projects.vercel.app",
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tipos-sierra', tipoSierraRoutes);
app.use('/api/sierras', sierraRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reportes', reportesRoutes);

export default app;
