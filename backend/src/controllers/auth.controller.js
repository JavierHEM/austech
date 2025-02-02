// backend/src/controllers/auth.controller.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.usuario.findUnique({
      where: { email },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    if (!user || !user.estado) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const validateToken = async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    if (!user || !user.estado) {
      return res.status(401).json({ message: 'Usuario no válido' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error al validar token' });
  }
};

export const register = async (req, res) => {
  try {
    const { email, nombre, password, rol, sucursalId } = req.body;

    const userExists = await prisma.usuario.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: {
        email,
        nombre,
        password: hashedPassword,
        rol,
        sucursalId: Number(sucursalId),
        estado: true
      },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario' });
  }
};