# 🧹 REGLA DE ESPACIO DE TRABAJO: EJECUCIÓN LIMPIA Y ZERO DANGLING TASKS

## 1. Cierre obligatorio de procesos en segundo plano
- Nunca dejes procesos asíncronos, subagentes, temporizadores (`schedule`), watchers o comandos daemon corriendo en segundo plano tras terminar una tarea.
- Al terminar cada turno, el agente debe asegurarse de que no queden procesos residuales activos para que el IDE pase inmediatamente al estado **Idle (Inactivo)**.

## 2. Garantía de Estado Inactivo (Idle) Inmediato
- El agente debe detener inmediatamente las herramientas y ceder el turno limpio al usuario.
- Esto asegura que el chat quede 100% receptivo y que el usuario pueda escribir y presionar `Enter` con envío directo e instantáneo.
