/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SQLite is native module, mark as external for server components
  serverExternalPackages: ['better-sqlite3'],
};

module.exports = nextConfig;
