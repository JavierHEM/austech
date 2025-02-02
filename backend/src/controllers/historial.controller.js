// backend/src/controllers/historial.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Obtener historial por sierra
export const getBySierraId = async (req, res) => {
  try {
    const { sierraId } = req.params;
    const historial = await prisma.historial.findMany({
      where: { sierraId: Number(sierraId) },
      include: {
        sierra: {
          include: { tipoSierra: true }
        },
        usuario: {
          select: { nombre: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    res.json(historial);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al obtener historial de la sierra'
    });
  }
};

// Obtener historial por sucursal
export const getHistorialBySucursal = async (req, res) => {
  try {
    const { sucursalId } = req.params;
    
    // Si es 'all', traer todos los registros
    const where = sucursalId === 'all' 
      ? {} 
      : {
          sierra: {
            sucursalId: Number(sucursalId)
          }
        };

    const historial = await prisma.historial.findMany({
      where,
      include: {
        sierra: {
          include: { 
            tipoSierra: true,
            sucursal: true 
          }
        },
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
      take: 100 // Limitamos a los últimos 100 registros para evitar sobrecarga
    });

    res.json(historial);
  } catch (error) {
    console.error('Error en getHistorialBySucursal:', error);
    res.status(500).json({
      message: 'Error al obtener historial de la sucursal',
      error: error.message
    });
  }
};

// Crear registro de afilado
export const createRegistroAfilado = async (req, res) => {
  try {
    const { sierraId, tipoAfilado, observaciones, esUltimoAfilado } = req.body;

    // Verificar existencia y estado de la sierra
    const sierra = await prisma.sierra.findUnique({
      where: { id: Number(sierraId) }
    });

    if (!sierra) {
      return res.status(404).json({
        message: 'Sierra no encontrada'
      });
    }

    // Verificar si la sierra está activa
    if (!sierra.estado) {
      return res.status(400).json({
        message: 'Esta sierra ya fue marcada como "Último afilado" y no puede ser afilada nuevamente.'
      });
    }

    // Crear el registro en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Registrar el afilado
      const historial = await tx.historial.create({
        data: {
          sierraId: Number(sierraId),
          usuarioId: req.user.id,
          tipoAfilado,
          observaciones,
          fecha: new Date()
        },
        include: {
          sierra: {
            include: {
              tipoSierra: true
            }
          },
          usuario: {
            select: {
              nombre: true
            }
          }
        }
      });

      // Si es el último afilado, actualizar el estado de la sierra
      if (esUltimoAfilado) {
        await tx.sierra.update({
          where: { id: Number(sierraId) },
          data: {
            estado: false,
            fechaUltimoAfilado: new Date()
          }
        });
      }

      return historial;
    });

    res.status(201).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al registrar el afilado'
    });
  }
};