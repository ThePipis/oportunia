# Lecciones Aprendidas (Lessons)

## 1. Evitar la Inversión Global de Escalas de Color de Tailwind
- **Problema:** Sobrescribir `--tw-color-slate-*` y `--tw-color-white` en `.light` invierte los valores de todas las clases predefinidas de Tailwind, causando que bordes, textos atenuados e iconos se vuelvan completamente invisibles o pierdan contraste.
- **Solución:** Utilizar variables semánticas HSL en `:root` y `.dark` (`--background`, `--foreground`, `--card`, `--border`, `--muted`) combinadas con clases dinámicas (`bg-white dark:bg-slate-900`) o tokens mapeados en `tailwind.config.ts`.

## 2. Garantía de Rollback en Refactors de Diseño
- **Patrón:** Antes de refactorizar estilos globales, generar un snapshot de git (`git branch` + `git diff > patch`) y crear un script ejecutable (`scripts/rollback-*.ps1`) para que el usuario pueda restaurar el estado previo de forma determinista y sin fricción.

## 3. Componentes Primitivos Base vs Clases Hardcodeadas
- **Problema:** Si un componente primitivo como `Label` o `Input` tiene clases estáticas (`text-slate-200` o `bg-slate-900/60`), el cambio de modo claro a nivel de página no afectará a los formularios y provocará invisibilidad de etiquetas ("Ubicación", "Categoría", campos de configuración).
- **Solución:** Corregir los primitivos base (`components/ui/label.tsx`, `components/ui/input.tsx`) primero con tokens dinámicos `text-slate-700 dark:text-slate-200` y `bg-white dark:bg-slate-900/60` para propagar el contraste correcto a todas las vistas.
