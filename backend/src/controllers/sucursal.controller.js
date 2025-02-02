// backend/src/controllers/sucursal.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getSucursales = async (req, res) => {
  try {
    const sucursales = await prisma.sucursal.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    res.json(sucursales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: Number(id) }
    });

    if (!sucursal) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }

    res.json(sucursal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createSucursal = async (req, res) => {
  try {
    const { nombre, direccion, telefono } = req.body;
    const sucursal = await prisma.sucursal.create({
      data: {
        nombre,
        direccion,
        telefono,
        estado: true
      }
    });
    res.status(201).json(sucursal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, estado } = req.body;
    
    const sucursal = await prisma.sucursal.update({
      where: { id: Number(id) },
      data: {
        nombre,
        direccion,
        telefono,
        estado: estado ?? true
      }
    });
    
    res.json(sucursal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteSucursal = async (req, res) => {
  try {
    const { id } = req.params;
    
    // En lugar de eliminar, marcamos como inactiva
    const sucursal = await prisma.sucursal.update({
      where: { id: Number(id) },
      data: { estado: false }
    });
    
    res.json(sucursal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};