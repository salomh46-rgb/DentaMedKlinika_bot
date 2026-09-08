@echo off
chcp 65001 > nul
title DentaMed Clinic Ecosystem Launcher
echo ======================================================
echo 🌿 DentaMed Atelier — LOR va Stomatologiya Markazi
echo ======================================================
echo.
echo [1/3] Backend API server ishga tushirilmoqda (Port: 8000)...
start "DentaMed API" cmd /k "cd /d D:\ALLProjects\dental_lor_med\backend && python server.py"

echo [2/3] Frontend Vite server ishga tushirilmoqda (Port: 5173)...
start "DentaMed Frontend" cmd /k "cd /d D:\ALLProjects\dental_lor_med\frontend && npm run dev"

echo [3/3] Telegram Bot tekshirilmoqda...
start "DentaMed Telegram Bot" cmd /k "cd /d D:\ALLProjects\dental_lor_med\backend && python bot.py"

echo.
echo ======================================================
echo ✅ Tizim to'liq ishga tushirildi!
echo 🌐 Veb-ilova: http://localhost:5173
echo 🔌 API server: http://localhost:8000/docs
echo ======================================================
pause
