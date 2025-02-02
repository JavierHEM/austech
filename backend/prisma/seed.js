// backend/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);
  
  await prisma.usuario.create({
    data: {
      email: 'admin@example.com',
      nombre: 'Admin',
      password,
      rol: 'GERENTE',
      sucursalId: 1,
      estado: true
    }
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });