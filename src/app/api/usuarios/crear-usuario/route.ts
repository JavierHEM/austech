import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    
    // Crear usuario en Auth

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
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
      console.error('No se recibieron datos de usuario después de la creación');
      return NextResponse.json(
        { error: 'No se pudo crear el usuario' },
        { status: 500 }
      );
    }
    

    
    // Esperar un momento para que el trigger tenga tiempo de ejecutarse
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar si el usuario fue creado en la tabla usuarios por el trigger
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    // Si el usuario no fue creado automáticamente por el trigger, lo creamos manualmente
    if (userError) {

      
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          email,
          nombre_completo,
          rol_id,
          empresa_id: empresa_id || null,
          activo: activo !== false,
          creado_en: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error al crear usuario manualmente:', insertError);
        
        // Intentar eliminar el usuario de Auth si falla la creación en la tabla usuarios
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        return NextResponse.json(
          { error: 'Error al crear el usuario en la base de datos' },
          { status: 500 }
        );
      }
    } else {
      // El usuario fue creado por el trigger, pero podría necesitar actualización
      // para campos como empresa_id que no están en el trigger
      if (userData && (empresa_id || activo === false)) {

        
        const updateData: any = {};
        
        if (empresa_id) {
          updateData.empresa_id = empresa_id;
        }
        
        if (activo === false) {
          updateData.activo = false;
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('usuarios')
            .update(updateData)
            .eq('id', authData.user.id);
            
          if (updateError) {
            console.error('Error al actualizar campos adicionales:', updateError);
            // No fallamos la operación completa por esto
          }
        }
      }
    }
    
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
