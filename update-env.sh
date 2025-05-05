#!/bin/bash

# Script para actualizar el archivo .env.local con la clave de rol de servicio correcta

echo "Este script actualizará tu archivo .env.local con la clave de rol de servicio correcta."
echo "Por favor, ingresa la clave de rol de servicio de Supabase (service_role key):"
read SERVICE_ROLE_KEY

# Verificar si el archivo .env.local existe
if [ -f .env.local ]; then
  # Comprobar si ya existe la variable SUPABASE_SERVICE_ROLE_KEY
  if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    # Reemplazar la línea existente
    sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env.local
  else
    # Agregar la variable al final del archivo
    echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> .env.local
  fi
  echo "Archivo .env.local actualizado correctamente."
else
  # Crear el archivo .env.local basado en .env.example
  cp .env.example .env.local
  sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env.local
  echo "Se ha creado un nuevo archivo .env.local basado en .env.example."
fi

echo "Ahora reinicia el servidor con 'npm run dev' para aplicar los cambios."
