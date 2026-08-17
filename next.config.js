/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // node:sqlite es un módulo built-in de Node 22+ que debe quedar external
  // para que Next.js no intente bundlearlo (causa "No such built-in module")
  serverExternalPackages: ["node:sqlite"],
};

module.exports = nextConfig;
