import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configurar el runtime para usar Node.js en lugar de Edge
export const runtime = 'nodejs';
// Configurar el tiempo máximo de ejecución (opcional)
export const maxDuration = 30; // segundos - aumentado para dar más tiempo

// Inicializar el cliente de Supabase con credenciales de servicio solo cuando se necesite
// para evitar problemas de inicialización temprana
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Faltan variables de entorno para Supabase');
  }
  
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request: Request) {
  // Verificar explícitamente la clave de servicio
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.length < 10) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY no está configurada correctamente');
    return NextResponse.json(
      { error: 'Error de configuración del servidor: Clave de servicio no disponible o inválida' },
      { status: 500 }
    );
  }
  
  try {
    // Inicializar el cliente de Supabase con la clave de servicio
    let supabase;
    try {
      supabase = getSupabaseAdmin();

    } catch (initError: any) {
      console.error('Error al inicializar Supabase Admin:', initError.message);
      return NextResponse.json(
        { error: `Error de configuración: ${initError.message}` },
        { status: 500 }
      );
    }
    
    const requestData = await request.json();
    const { email, password, nombre_completo, rol_id, empresa_id, activo } = requestData;
    

    // Validaciones básicas
    if (!email || !password || !nombre_completo || !rol_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    // Validar empresa_id para usuarios con rol cliente (rol_id = 3)
    if (rol_id === 3 && !empresa_id) {
      return NextResponse.json(
        { error: 'El campo empresa es requerido para usuarios de tipo cliente' },
        { status: 400 }
      );
    }
    
    // Procesar el empresa_id correctamente
    let empresaIdValue = null;
    if (rol_id === 3 && empresa_id) {
      // Para usuarios cliente, asegurarse de que empresa_id sea un número
      empresaIdValue = typeof empresa_id === 'string' ? parseInt(empresa_id) : empresa_id;

    }
    
    // Usar el cliente admin para crear el usuario

    // Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nombre_completo,
        rol_id
      }
    });
    
    if (authError) {
      console.error('Error detallado al crear usuario en Auth:', JSON.stringify(authError));
      return NextResponse.json(
        { error: `Error al crear usuario en Auth: ${authError.message}` },
        { status: 400 }
      );
    }
    
    if (!authData || !authData.user) {
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      );
    }
    
    // Esperar para que el trigger tenga tiempo de ejecutarse
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar si el usuario fue creado en la tabla usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    

    // Siempre actualizar el usuario para asegurarnos de que tenga los datos correctos
    // especialmente el empresa_id para usuarios cliente
    const { error: updateError } = await supabase
      .from('usuarios')
      .upsert({
        id: authData.user.id,
        email,
        nombre_completo,
        rol_id,
        empresa_id: empresaIdValue,
        activo: activo !== false,
        creado_en: new Date().toISOString()
      });
      
    if (updateError) {
      console.error('Error al actualizar usuario:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el usuario en la tabla usuarios' },
        { status: 500 }
      );
    }
    
    // Verificar nuevamente después de la actualización
    const { data: updatedUserData, error: verifyError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      

    return NextResponse.json({
      success: true,
      data: authData.user
    });
  } catch (error: any) {
    console.error('Error en el endpoint de creación de usuarios:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
