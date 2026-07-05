@echo off
chcp 65001 >nul
title 股票研究看板

:: ============================================
::  股票研究看板 - Windows 一键启动脚本
::  用法：双击此文件即可启动
:: ============================================

set "PROJECT_DIR=%~dp0"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     📊 股票研究看板 v2.1.0         ║
echo  ╚══════════════════════════════════════╝
echo.

:: 检查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ 未检测到 Node.js，请先安装：https://nodejs.org/
    echo     推荐安装 LTS 版本（v18 或 v20）
    pause
    exit /b 1
)

echo  ✅ Node.js: 
node -v

:: 检查依赖
if not exist "%PROJECT_DIR%node_modules" (
    echo.
    echo  📦 首次运行，正在安装依赖...
    cd /d "%PROJECT_DIR%"
    call npm install --production
    if %ERRORLEVEL% NEQ 0 (
        echo  ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo  ✅ 依赖安装完成
)

:: 启动服务
echo.
echo  🚀 正在启动服务器...
echo  📍 网站地址: http://localhost:3000
echo  📋 按 Ctrl+C 停止服务
echo.

cd /d "%PROJECT_DIR%"
npx tsx server/index.ts

pause
