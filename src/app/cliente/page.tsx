'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ClienteDashboard } from '@/components/cliente/ClienteDashboard';
import { SessionKeepAlive } from '@/components/SessionKeepAlive';

export default function ClientePage() {
  const { session, role } = useAuth();
  const router = useRouter();

  // Redirigir si no hay sesión o el rol no es cliente
  if (!session) {
    return null; // No renderizar nada mientras se verifica la sesión
  }

  if (role !== 'cliente' && role !== 'gerente' && role !== 'administrador') {
    router.push('/dashboard');
    return null;
  }

  return (
    <>
      <SessionKeepAlive />
      <ClienteDashboard />
    </>
  );
}
