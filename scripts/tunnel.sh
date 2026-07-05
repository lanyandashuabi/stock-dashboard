#!/bin/bash
# 内网穿透脚本 - 使用 localtunnel 生成临时公网链接
# 用法: bash scripts/tunnel.sh

echo "🔗 正在启动内网穿透..."
echo ""

# 检查 localtunnel 是否安装
if ! command -v lt &> /dev/null; then
  echo "📦 安装 localtunnel..."
  npm install -g localtunnel
fi

# 启动隧道
echo "🌐 生成公网链接中..."
lt --port 3000 --print-requests 2>&1 | while read line; do
  if echo "$line" | grep -q "your url is"; then
    echo ""
    echo "============================================"
    echo "  ✅ 公网链接已生成！"
    echo "  $line"
    echo "  将此链接发给朋友即可访问"
    echo "  关闭终端或 Ctrl+C 停止分享"
    echo "============================================"
    echo ""
  fi
done
