#!/bin/bash

# AI新闻系统快速启动脚本
# 用于快速配置和启动AI新闻收集和推送系统

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo
    print_message $BLUE "=================================================="
    print_message $BLUE "        AI新闻系统快速启动脚本"
    print_message $BLUE "=================================================="
    echo
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_error() {
    print_message $RED "❌ $1"
}

# 检查Node.js版本
check_nodejs() {
    print_message $BLUE "🔍 检查Node.js版本..."
    
    if ! command -v node &> /dev/null; then
        print_error "未找到Node.js，请先安装Node.js 16或更高版本"
        exit 1
    fi
    
    local node_version=$(node -v | cut -d'v' -f2)
    local major_version=$(echo $node_version | cut -d'.' -f1)
    
    if [ "$major_version" -lt 16 ]; then
        print_error "Node.js版本过低，当前版本: $node_version，需要16或更高版本"
        exit 1
    fi
    
    print_success "Node.js版本检查通过: $node_version"
}

# 检查npm
check_npm() {
    print_message $BLUE "🔍 检查npm..."
    
    if ! command -v npm &> /dev/null; then
        print_error "未找到npm，请先安装npm"
        exit 1
    fi
    
    print_success "npm检查通过"
}

# 安装依赖
install_dependencies() {
    print_message $BLUE "📦 安装项目依赖..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "依赖安装完成"
}

# 检查环境变量文件
check_env_file() {
    print_message $BLUE "🔧 检查环境变量配置..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_warning "未找到.env文件，正在从.env.example创建..."
            cp .env.example .env
            print_success "已创建.env文件，请编辑配置"
        else
            print_error "未找到.env或.env.example文件"
            exit 1
        fi
    else
        print_success "找到.env文件"
    fi
}

# 验证环境变量
validate_env() {
    print_message $BLUE "🔍 验证环境变量配置..."
    
    local required_vars=("EMAIL_HOST" "EMAIL_PORT" "EMAIL_USER" "EMAIL_PASS" "RECIPIENT_EMAIL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env || grep -q "^${var}=$" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        print_error "以下环境变量未正确配置:"
        for var in "${missing_vars[@]}"; do
            echo "   - $var"
        done
        print_message $YELLOW "\n请编辑.env文件并设置这些变量"
        return 1
    else
        print_success "环境变量配置验证通过"
        return 0
    fi
}

# 运行测试
run_tests() {
    print_message $BLUE "🧪 运行系统测试..."
    
    if npm test; then
        print_success "系统测试通过"
        return 0
    else
        print_warning "系统测试失败，但可以继续启动服务"
        return 1
    fi
}

# 启动服务
start_service() {
    print_message $BLUE "🚀 启动AI新闻服务..."
    
    if [ "$1" = "dev" ]; then
        print_message $YELLOW "以开发模式启动..."
        npm run dev
    else
        print_message $YELLOW "以生产模式启动..."
        npm start
    fi
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -d, --dev      以开发模式启动"
    echo "  -t, --test     只运行测试，不启动服务"
    echo "  -s, --skip-test 跳过测试直接启动"
    echo
    echo "示例:"
    echo "  $0              # 标准启动流程"
    echo "  $0 --dev        # 开发模式启动"
    echo "  $0 --test       # 只运行测试"
    echo "  $0 --skip-test  # 跳过测试启动"
}

# 显示配置说明
show_config_help() {
    print_message $BLUE "📧 邮箱配置说明:"
    echo
    echo "QQ邮箱配置:"
    echo "  EMAIL_HOST=smtp.qq.com"
    echo "  EMAIL_PORT=587"
    echo "  EMAIL_USER=your-email@qq.com"
    echo "  EMAIL_PASS=your-authorization-code  # QQ邮箱授权码，不是密码"
    echo
    echo "Gmail配置:"
    echo "  EMAIL_HOST=smtp.gmail.com"
    echo "  EMAIL_PORT=587"
    echo "  EMAIL_USER=your-email@gmail.com"
    echo "  EMAIL_PASS=your-app-specific-password"
    echo
    echo "定时任务配置 (可选):"
    echo "  CRON_SCHEDULE=0 8 * * *  # 每天早上8点"
    echo
    print_message $YELLOW "请编辑.env文件完成配置后重新运行此脚本"
}

# 主函数
main() {
    local dev_mode=false
    local test_only=false
    local skip_test=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -d|--dev)
                dev_mode=true
                shift
                ;;
            -t|--test)
                test_only=true
                shift
                ;;
            -s|--skip-test)
                skip_test=true
                shift
                ;;
            *)
                print_error "未知参数: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_header
    
    # 环境检查
    check_nodejs
    check_npm
    
    # 安装依赖
    install_dependencies
    
    # 检查环境变量
    check_env_file
    
    # 如果环境变量配置不完整，显示帮助并退出
    if ! validate_env; then
        show_config_help
        exit 1
    fi
    
    # 运行测试
    if [ "$test_only" = true ]; then
        run_tests
        exit $?
    elif [ "$skip_test" = false ]; then
        run_tests
    fi
    
    # 如果只是测试模式，到这里就结束了
    if [ "$test_only" = true ]; then
        print_success "测试完成"
        exit 0
    fi
    
    # 启动服务
    if [ "$dev_mode" = true ]; then
        start_service "dev"
    else
        start_service "prod"
    fi
}

# 捕获中断信号
trap 'print_warning "启动过程被中断"; exit 1' INT TERM

# 运行主函数
main "$@"