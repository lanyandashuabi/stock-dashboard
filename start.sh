#!/bin/bash
# ============================================
#  股票研究看板 - Linux/macOS 一键启动脚本
#  用法: bash start.sh
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║     📊 股票研究看板 v2.1.0         ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "  ❌ 未检测到 Node.js"
    echo "     安装方法: https://nodejs.org/ 或 brew install node / apt install nodejs"
    exit 1
fi

echo "  ✅ Node.js: $(node -v)"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo ""
    echo "  📦 首次运行，正在安装依赖..."
    npm install --production
    echo "  ✅ 依赖安装完成"
fi

# 检查是否有 PM2
USE_PM2=false
if command -v pm2 &> /dev/null; then
    USE_PM2=true
fi

echo ""
echo "  🚀 正在启动服务器..."
echo "  📍 网站地址: http://localhost:3000"
echo ""

if [ "$USE_PM2" = true ]; then
    echo "  📌 使用 PM2 守护模式启动（崩溃自动重启）"
    pm2 start pm2.config.json
    echo ""
    echo "  ✅ 已启动！常用命令:"
    echo "     pm2 status         查看状态"
    echo "     pm2 logs           查看日志"
    echo "     pm2 stop stock-dashboard  停止"
    echo ""
else
    echo "  📌 使用前台模式启动（Ctrl+C 停止）"
    echo "  💡 安装 PM2 可获得进程守护: npm install -g pm2 && pm2 start pm2.config.json"
    echo ""
    npx tsx server/index.ts
fi
