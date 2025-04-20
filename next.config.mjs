/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
      domains: ['localhost'],
      unoptimized: true, // Esto ayuda con problemas de imágenes en Vercel
    },
    // Eliminamos la configuración i18n obsoleta que puede causar problemas
    // La configuración i18n está obsoleta en las nuevas versiones de Next.js
    
    // Redirección del inicio a la página de login
    async redirects() {
      return [
        {
          source: '/',
          destination: '/login',
          permanent: false, // Cambiado a false para evitar problemas de caché
        },
      ];
    },
    // Configuración de entornos
    env: {
      APP_NAME: 'Sistema de Gestión de Afilado de Sierras Austech',
    },
    // Optimizaciones de compilación
    compiler: {
      // Elimina las consolas en producción
      removeConsole: process.env.NODE_ENV === 'production',
    },
  };
  
  export default nextConfig;