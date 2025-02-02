// backend/src/controllers/tipoSierra.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Obtener todos los tipos de sierra
export const getTiposSierra = async (req, res) => {
  try {
    const tiposSierra = await prisma.tipoSierra.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    res.json(tiposSierra);
  } catch (error) {
    console.error('Error al obtener tipos de sierra:', error);
    res.status(500).json({ message: 'Error al obtener los tipos de sierra' });
  }
};

// Obtener un tipo de sierra
export const getTipoSierra = async (req, res) => {
  try {
    const { id } = req.params;
    const tipoSierra = await prisma.tipoSierra.findUnique({
      where: { id: Number(id) }
    });

    if (!tipoSierra) {
      return res.status(404).json({ message: 'Tipo de sierra no encontrado' });
    }

    res.json(tipoSierra);
  } catch (error) {
    console.error('Error al obtener tipo de sierra:', error);
    res.status(500).json({ message: 'Error al obtener el tipo de sierra' });
  }
};

// Crear tipo de sierra
export const createTipoSierra = async (req, res) => {
  try {
    const { codigo, nombre, descripcion } = req.body;

    // Verificar si el código ya existe
    const existingTipo = await prisma.tipoSierra.findUnique({
      where: { codigo }
    });

    if (existingTipo) {
      return res.status(400).json({ message: 'El código ya está registrado' });
    }

    const tipoSierra = await prisma.tipoSierra.create({
      data: {
        codigo,
        nombre,
        descripcion,
        estado: true
      }
    });

    res.status(201).json(tipoSierra);
  } catch (error) {
    console.error('Error al crear tipo de sierra:', error);
    res.status(500).json({ message: 'Error al crear el tipo de sierra' });
  }
};

// Actualizar tipo de sierra
export const updateTipoSierra = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, estado } = req.body;

    // Verificar si el código ya existe en otro tipo de sierra
    if (codigo) {
      const existingTipo = await prisma.tipoSierra.findFirst({
        where: {
          codigo,
          id: { not: Number(id) }
        }
      });

      if (existingTipo) {
        return res.status(400).json({ message: 'El código ya está registrado' });
      }
    }
    
    const tipoSierra = await prisma.tipoSierra.update({
      where: { id: Number(id) },
      data: {
        codigo,
        nombre,
        descripcion,
        estado
      }
    });
    
    res.json(tipoSierra);
  } catch (error) {
    console.error('Error al actualizar tipo de sierra:', error);
    res.status(500).json({ message: 'Error al actualizar el tipo de sierra' });
  }
};

// Eliminar tipo de sierra (cambiar estado a inactivo)
export const deleteTipoSierra = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay sierras asociadas
    const sierrasAsociadas = await prisma.sierra.count({
      where: { tipoSierraId: Number(id) }
    });

    if (sierrasAsociadas > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el tipo de sierra porque tiene sierras asociadas' 
      });
    }
    
    const tipoSierra = await prisma.tipoSierra.update({
      where: { id: Number(id) },
      data: { estado: false }
    });
    
    res.json(tipoSierra);
  } catch (error) {
    console.error('Error al eliminar tipo de sierra:', error);
    res.status(500).json({ message: 'Error al eliminar el tipo de sierra' });
  }
};