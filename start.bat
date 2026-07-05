@echo off
title 股票研究看板

echo.
echo   ╔══════════════════════════════════════╗
echo   ║     📊 股票研究看板 v2.3.0         ║
echo   ╚══════════════════════════════════════╝
echo.

:: ============================================
:: 步骤1：检查 Node.js
:: ============================================
echo   [1/3] 检查 Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo   ❌ 没有安装 Node.js！
    echo.
    echo   请按以下步骤操作：
    echo   1. 打开浏览器访问 https://nodejs.org
    echo   2. 下载左边的 LTS 版本
    echo   3. 安装时一路点"下一步"
    echo   4. 安装完成后，重新双击 start.bat
    echo.
    pause
    exit /b 1
)
echo   ✅ Node.js 已安装

:: ============================================
:: 步骤2：安装依赖
:: ============================================
echo   [2/3] 检查依赖...
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

if not exist "node_modules" (
    echo   首次运行，正在安装依赖（需要联网，约1-2分钟）...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo   ❌ 依赖安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo   ✅ 依赖安装完成
) else (
    echo   ✅ 依赖已就绪
)

:: ============================================
:: 步骤3：启动
:: ============================================
echo   [3/3] 启动服务器...
echo.
echo   ╔══════════════════════════════════════════╗
echo   ║   🚀 服务启动中...                      ║
echo   ║   📍 浏览器打开: http://localhost:3000   ║
echo   ║   🛑 关闭此窗口 = 停止服务               ║
echo   ╚══════════════════════════════════════════╝
echo.

start http://localhost:3000
npx tsx server/index.ts

pause
