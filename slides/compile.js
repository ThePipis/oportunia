// D:\NEGOCIOIA\slides\compile.js
// Compila todos los slides en una sola presentación
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "AI Sales Radar - Plan de Implementación";
pres.author = "Mavis";

// Theme: profesional B2B light con acentos vibrantes
const theme = {
  primary: "0F172A",   // slate-900, títulos
  secondary: "0EA5E9", // sky-500, azul acento
  accent: "F97316",    // orange-500, naranja highlight
  light: "E0F2FE",     // sky-100, fondo de cards
  bg: "FFFFFF"         // blanco
};

const slideFiles = fs.readdirSync(__dirname)
  .filter(f => /^slide-\d+\.js$/.test(f))
  .sort();

console.log(`Compilando ${slideFiles.length} slides...`);

slideFiles.forEach(file => {
  const slideModule = require(path.join(__dirname, file));
  if (typeof slideModule.createSlide === "function") {
    slideModule.createSlide(pres, theme);
    console.log(`  ✓ ${file}`);
  } else {
    console.warn(`  ✗ ${file} no exporta createSlide`);
  }
});

const outFile = path.join(__dirname, "output", "AI_Sales_Radar_Plan.pptx");
pres.writeFile({ fileName: outFile })
  .then(() => console.log(`\n✅ Presentación guardada en: ${outFile}`));
