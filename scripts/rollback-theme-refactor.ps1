# Script de Rollback Total - Tema Claro / Oscuro
# Restaura el código al estado exacto previo a la refactorización con theme-architect

Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "  RESTAURANDO ESTADO PREVIO DE LA APP    " -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

$patchPath = Join-Path $PSScriptRoot "..\baseline_backup.patch"

if (Test-Path $patchPath) {
    Write-Host "[1/3] Limpiando cambios en working tree..." -ForegroundColor Cyan
    git checkout -- .
    
    Write-Host "[2/3] Aplicando patch de estado original..." -ForegroundColor Cyan
    git apply $patchPath
    
    Write-Host "[3/3] Rollback completado con éxito!" -ForegroundColor Green
} else {
    Write-Host "No se encontró baseline_backup.patch. Usando git checkout..." -ForegroundColor Red
    git checkout -- .
}

Write-Host "La app ha vuelto al estado exacto anterior." -ForegroundColor Green
