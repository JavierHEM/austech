/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
      domains: ['localhost'],
    },
    // Configuración de internacionalización
    i18n: {
      locales: ['es'],
      defaultLocale: 'es',
    },
    // Redirección del inicio a la página de login
    async redirects() {
      return [
        {
          source: '/',
          destination: '/login',
          permanent: true,
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