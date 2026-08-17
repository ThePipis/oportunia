/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // node:sqlite es nativo, no necesita configuración especial
  experimental: {
    // SQLite se carga como módulo nativo en el servidor
  },
};

module.exports = nextConfig;
