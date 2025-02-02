// backend/src/controllers/sierra.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Obtener todas las sierras
export const getSierras = async (req, res) => {
  try {
    const sierras = await prisma.sierra.findMany({
      include: {
        tipoSierra: true,
        sucursal: true
      },
      orderBy: {
        codigo: 'asc'
      }
    });
    res.json(sierras);
  } catch (error) {
    console.error('Error al obtener sierras:', error);
    res.status(500).json({ message: 'Error al obtener las sierras' });
  }
};

// Obtener sierra por ID
export const getSierra = async (req, res) => {
  try {
    const { id } = req.params;
    const sierra = await prisma.sierra.findUnique({
      where: { id: Number(id) },
      include: {
        tipoSierra: true,
        sucursal: true,
        historial: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true
              }
            }
          },
          orderBy: {
            fecha: 'desc'
          },
          take: 5
        }
      }
    });

    if (!sierra) {
      return res.status(404).json({ message: 'Sierra no encontrada' });
    }

    res.json(sierra);
  } catch (error) {
    console.error('Error al obtener sierra:', error);
    res.status(500).json({ message: 'Error al obtener la sierra' });
  }
};

// Buscar sierra por código
export const getSierraPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    const sierra = await prisma.sierra.findFirst({
      where: {
        codigo: codigo,
        estado: true
      },
      include: {
        tipoSierra: true,
        sucursal: true
      }
    });

    if (!sierra) {
      return res.status(404).json({ message: 'Sierra no encontrada' });
    }

    res.json(sierra);
  } catch (error) {
    console.error('Error al buscar sierra por código:', error);
    res.status(500).json({ message: 'Error al buscar la sierra' });
  }
};

// Obtener sierras por sucursal
export const getSierrasBySucursal = async (req, res) => {
  try {
    const { sucursalId } = req.params;
    const sierras = await prisma.sierra.findMany({
      where: { 
        sucursalId: Number(sucursalId),
        estado: true
      },
      include: {
        tipoSierra: true,
        sucursal: true
      },
      orderBy: {
        codigo: 'asc'
      }
    });
    res.json(sierras);
  } catch (error) {
    console.error('Error al obtener sierras por sucursal:', error);
    res.status(500).json({ message: 'Error al obtener las sierras' });
  }
};

// Crear sierra
export const createSierra = async (req, res) => {
  try {
    const { codigo, tipoSierraId, sucursalId } = req.body;

    // Verificar si el código ya existe
    const sierraExistente = await prisma.sierra.findFirst({
      where: { codigo }
    });

    if (sierraExistente) {
      return res.status(400).json({ message: 'El código ya está registrado' });
    }

    // Verificar que exista el tipo de sierra
    const tipoSierra = await prisma.tipoSierra.findUnique({
      where: { id: Number(tipoSierraId) }
    });

    if (!tipoSierra) {
      return res.status(404).json({ message: 'Tipo de sierra no encontrado' });
    }

    // Verificar que exista la sucursal
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: Number(sucursalId) }
    });

    if (!sucursal) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }

    const sierra = await prisma.sierra.create({
      data: {
        codigo,
        tipoSierraId: Number(tipoSierraId),
        sucursalId: Number(sucursalId),
        estado: true
      },
      include: {
        tipoSierra: true,
        sucursal: true
      }
    });

    res.status(201).json(sierra);
  } catch (error) {
    console.error('Error al crear sierra:', error);
    res.status(500).json({ message: 'Error al crear la sierra' });
  }
};

// Actualizar sierra
export const updateSierra = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, tipoSierraId, sucursalId, estado } = req.body;

    // Verificar que la sierra exista
    const sierraExiste = await prisma.sierra.findUnique({
      where: { id: Number(id) }
    });

    if (!sierraExiste) {
      return res.status(404).json({ message: 'Sierra no encontrada' });
    }

    // Verificar si el código ya existe en otra sierra
    if (codigo !== sierraExiste.codigo) {
      const codigoExiste = await prisma.sierra.findFirst({
        where: {
          codigo,
          id: { not: Number(id) }
        }
      });

      if (codigoExiste) {
        return res.status(400).json({ message: 'El código ya está registrado en otra sierra' });
      }
    }

    // Actualizar sierra
    const sierra = await prisma.sierra.update({
      where: { id: Number(id) },
      data: {
        codigo,
        tipoSierraId: Number(tipoSierraId),
        sucursalId: Number(sucursalId),
        estado
      },
      include: {
        tipoSierra: true,
        sucursal: true
      }
    });

    res.json(sierra);
  } catch (error) {
    console.error('Error al actualizar sierra:', error);
    res.status(500).json({ message: 'Error al actualizar la sierra' });
  }
};

// Eliminar sierra (cambiar estado a inactivo)
export const deleteSierra = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la sierra exista
    const sierra = await prisma.sierra.findUnique({
      where: { id: Number(id) },
      include: {
        historial: {
          take: 1
        }
      }
    });

    if (!sierra) {
      return res.status(404).json({ message: 'Sierra no encontrada' });
    }

    // Verificar si tiene historial
    if (sierra.historial.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la sierra porque tiene historial de afilados' 
      });
    }

    // Desactivar sierra
    const sierraActualizada = await prisma.sierra.update({
      where: { id: Number(id) },
      data: { estado: false },
      include: {
        tipoSierra: true,
        sucursal: true
      }
    });

    res.json(sierraActualizada);
  } catch (error) {
    console.error('Error al eliminar sierra:', error);
    res.status(500).json({ message: 'Error al eliminar la sierra' });
  }
};

export const verificarCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const sierra = await prisma.sierra.findFirst({
      where: { codigo }
    });

    if (sierra) {
      return res.status(400).json({
        message: 'El código ya está registrado en el sistema'
      });
    }

    res.json({ disponible: true });
  } catch (error) {
    res.status(500).json({
      message: 'Error al verificar el código'
    });
  }
};