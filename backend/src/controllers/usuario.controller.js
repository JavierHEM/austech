// backend/src/controllers/usuario.controller.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Obtener todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        sucursal: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
};

// Obtener un usuario
export const getUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        sucursal: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener el usuario' });
  }
};

// Crear usuario
export const createUsuario = async (req, res) => {
  try {
    const { email, nombre, password, rol, sucursalId } = req.body;

    // Verificar si el email ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        nombre,
        password: hashedPassword,
        rol,
        sucursalId: Number(sucursalId),
        estado: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        sucursal: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
};

// Actualizar usuario
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nombre, password, rol, sucursalId, estado } = req.body;

    // Verificar si el email ya existe en otro usuario
    if (email) {
      const existingUser = await prisma.usuario.findFirst({
        where: {
          email,
          id: { not: Number(id) }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está registrado' });
      }
    }

    // Preparar datos para actualización
    const updateData = {
      email,
      nombre,
      rol,
      sucursalId: Number(sucursalId),
      estado
    };

    // Si se proporciona una nueva contraseña, hashearla
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        sucursal: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });
    
    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};

// Eliminar usuario (cambiar estado a inactivo)
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { estado: false },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        estado: true,
        sucursal: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });
    
    res.json(usuario);
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};