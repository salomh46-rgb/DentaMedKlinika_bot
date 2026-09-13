#!/usr/bin/env bash
# ==============================================================================
# DentaMed Atelier CRM — 1-Click VPS Deployment Script (Ubuntu / Debian)
# Usage:
#   chmod +x deploy_vps.sh
#   ./deploy_vps.sh
# ==============================================================================

set -e

echo "🚀 [1/5] Tizim paketlarini yangilash va tekshirish..."
sudo apt-get update -y

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 [2/5] Docker o'rnatilmoqda..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "✅ Docker allaqachon o'rnatilgan."
fi

# Check Docker Compose plugin
if ! docker compose version &> /dev/null; then
    echo "📦 Docker Compose plagini o'rnatilmoqda..."
    sudo apt-get install -y docker-compose-plugin
fi

echo "🔐 [3/5] .env konfiguratsiyasini tekshirish..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "⚠️ backend/.env yaratildi (namuna asosida). Iltimos, BOT_TOKEN va parollarni kiriting."
    fi
fi

echo "🏗️ [4/5] Docker konteynerlarini yig'ish va ishga tushirish..."
docker compose down || true
docker compose build --no-cache
docker compose up -d

echo "🩺 [5/5] Tizim holatini tekshirish..."
sleep 4
docker compose ps

echo "=================================================================="
echo "🎉 DentaMed CRM muvaffaqiyatli ishga tushdi!"
echo "👉 API Server: http://localhost:8000/api/clinics"
echo "👉 Nginx Proxy: http://localhost:80"
echo "👉 Telegram Bot holati: 'docker compose logs -f bot'"
echo "=================================================================="
