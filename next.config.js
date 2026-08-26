/** @type {import('next').NextConfig} */
const nextConfig = {
  // StrictMode está deshabilitado por un bug conocido de react-leaflet@4 con
  // React 18: el MapContainer se monta dos veces en dev y Leaflet no se
  // limpia correctamente, tirando "Map container is already initialized".
  // Cuando actualicemos a react-leaflet@5 (requiere React 19), podemos
  // volver a activarlo.
  reactStrictMode: false,
  // node:sqlite es un módulo built-in de Node 22+ que debe quedar external
  // para que Next.js no intente bundlearlo (causa "No such built-in module")
  serverExternalPackages: ["node:sqlite"],
  // Optimización de importaciones pesadas (lucide-react, leaflet, jspdf, etc.)
  // para eliminar la sobrecarga de compilación Webpack en modo dev
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "leaflet",
      "react-leaflet",
      "jspdf",
      "pptxgenjs",
      "@radix-ui/react-dialog",
      "@radix-ui/react-label",
    ],
  },
};

module.exports = nextConfig;
