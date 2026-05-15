@echo off
echo Starting AutoTest backend (Laravel) and frontend (Nuxt)...
start "AutoTest Backend" cmd /k "cd /d D:\loyiha\autotest-backend && php artisan serve"
start "AutoTest Frontend" cmd /k "cd /d D:\loyiha\autotest-front && npm run dev"
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo Admin panel: http://localhost:8000/admin/login
