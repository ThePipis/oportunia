# Cómo correr el dev server (sin límite de 30 min)

## Opción 1 — Doble click (más fácil)

Una vez, ejecutá `Instalar acceso directo desktop.ps1` desde PowerShell. Eso te crea el ícono **"OportunIA Dev"** en tu escritorio. Cada vez que quieras usar la app, doble click en ese ícono. El server queda corriendo hasta que vos lo cierres.

## Opción 2 — Desde terminal

PowerShell:
```powershell
cd D:\NEGOCIOIA
.\dev-loop.ps1
```

CMD:
```
cd D:\NEGOCIOIA
dev-loop.cmd
```

Cualquiera de los dos hace lo mismo: corre `npm run dev` y, si se cae, lo reinicia automáticamente en 3 segundos. **No tiene límite de tiempo**.

## Por qué necesito esto

Si yo (Mavis) lanzo el server desde acá, las tareas en background tienen un límite estricto de 30 minutos por política del entorno. Después de eso el server muere silenciosamente y tu trabajo se interrumpe. El script de arriba resuelve eso corriendo el server desde tu lado, donde no hay límite.

## Cómo paro el server

Presioná **Ctrl+C dos veces** en la ventana de PowerShell/CMD donde corre el script. La primera vez te pregunta si querés abortar el batch, la segunda lo cierra definitivamente.

## Si editás código

El hot reload de Next.js sigue funcionando igual — el server recompila automáticamente cada vez que guardás un archivo `.tsx` / `.ts` / `.css`. No necesitás reiniciar manualmente.

## Verificá que funciona

Una vez levantado, abrí http://localhost:3000 en el navegador. Si ves el dashboard de OportunIA, todo OK.
