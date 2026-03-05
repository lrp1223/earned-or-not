#!/bin/bash
# 微信云函数一键部署脚本
# 用法：./deploy.sh

echo "🚀 开始部署云函数..."

# 检查是否在项目根目录
if [ ! -d "cloud/functions" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 云函数列表
FUNCTIONS=("user" "lottery" "scratch" "mahjong" "stats" "friend" "rank")

# 逐个部署
for func in "${FUNCTIONS[@]}"; do
    echo "📦 部署 $func..."
    
    cd "cloud/functions/$func" || exit
    
    # 安装依赖
    npm install --production
    
    # 返回根目录
    cd - > /dev/null || exit
    
    echo "✅ $func 部署完成"
done

echo ""
echo "🎉 所有云函数部署完成！"
echo "请在微信开发者工具中右键每个云函数文件夹，选择'上传并部署：云端安装依赖'"
