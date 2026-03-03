@echo off
setlocal enabledelayedexpansion

:: AI新闻系统快速启动脚本 (Windows版本)
:: 用于快速配置和启动AI新闻收集和推送系统

title AI新闻系统快速启动脚本

:: 颜色定义 (Windows 10+ 支持ANSI转义序列)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

:: 打印带颜色的消息
:print_message
set "color=%~1"
set "message=%~2"
echo %color%%message%%NC%
goto :eof

:: 打印标题
:print_header
echo.
call :print_message "%BLUE%" "=================================================="
call :print_message "%BLUE%" "        AI新闻系统快速启动脚本"
call :print_message "%BLUE%" "=================================================="
echo.
goto :eof

:: 打印成功消息
:print_success
call :print_message "%GREEN%" "✅ %~1"
goto :eof

:: 打印警告消息
:print_warning
call :print_message "%YELLOW%" "⚠️  %~1"
goto :eof

:: 打印错误消息
:print_error
call :print_message "%RED%" "❌ %~1"
goto :eof

:: 检查Node.js版本
:check_nodejs
call :print_message "%BLUE%" "🔍 检查Node.js版本..."

where node >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "未找到Node.js，请先安装Node.js 16或更高版本"
    goto :eof
)

:: 获取Node.js版本
for /f "tokens=*" %%i in ('node -v') do set node_version=%%i
set node_version=%node_version:v=%

:: 提取主版本号
for /f "tokens=1 delims=." %%i in ("%node_version%") do set major_version=%%i

if %major_version% lss 16 (
    call :print_error "Node.js版本过低，当前版本: %node_version%，需要16或更高版本"
    goto :eof
)

call :print_success "Node.js版本检查通过: %node_version%"
goto :eof

:: 检查npm
:check_npm
call :print_message "%BLUE%" "🔍 检查npm..."

where npm >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "未找到npm，请先安装npm"
    goto :eof
)

call :print_success "npm检查通过"
goto :eof

:: 安装依赖
:install_dependencies
call :print_message "%BLUE%" "📦 安装项目依赖..."

if exist package-lock.json (
    npm ci
) else (
    npm install
)

if %errorlevel% neq 0 (
    call :print_error "依赖安装失败"
    goto :eof
)

call :print_success "依赖安装完成"
goto :eof

:: 检查环境变量文件
:check_env_file
call :print_message "%BLUE%" "🔧 检查环境变量配置..."

if not exist .env (
    if exist .env.example (
        call :print_warning "未找到.env文件，正在从.env.example创建..."
        copy .env.example .env >nul
        call :print_success "已创建.env文件，请编辑配置"
    ) else (
        call :print_error "未找到.env或.env.example文件"
        goto :eof
    )
) else (
    call :print_success "找到.env文件"
)
goto :eof

:: 验证环境变量
:validate_env
call :print_message "%BLUE%" "🔍 验证环境变量配置..."

set "missing_vars="
set "required_vars=EMAIL_HOST EMAIL_PORT EMAIL_USER EMAIL_PASS RECIPIENT_EMAIL"

for %%v in (%required_vars%) do (
    findstr /r "^^%%v=.*[^ ]" .env >nul
    if %errorlevel% neq 0 (
        set "missing_vars=!missing_vars! %%v"
    )
)

if defined missing_vars (
    call :print_error "以下环境变量未正确配置:"
    for %%v in (%required_vars%) do (
        echo "    - %%v"
    )
    call :print_warning ""
    call :print_warning "请编辑.env文件并设置这些变量"
    goto :eof
) else (
    call :print_success "环境变量配置验证通过"
    exit /b 0
)
goto :eof

:: 运行测试
:run_tests
call :print_message "%BLUE%" "🧪 运行系统测试..."

npm test
if %errorlevel% equ 0 (
    call :print_success "系统测试通过"
    exit /b 0
) else (
    call :print_warning "系统测试失败，但可以继续启动服务"
    exit /b 1
)
goto :eof

:: 启动服务
:start_service
call :print_message "%BLUE%" "🚀 启动AI新闻服务..."

if "%~1"=="dev" (
    call :print_warning "以开发模式启动..."
    npm run dev
) else (
    call :print_warning "以生产模式启动..."
    npm start
)
goto :eof

:: 显示使用说明
:show_usage
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   /h, /help      显示此帮助信息
echo   /d, /dev       以开发模式启动
echo   /t, /test      只运行测试，不启动服务
echo   /s, /skip-test 跳过测试直接启动
echo.
echo 示例:
echo   %~nx0              # 标准启动流程
echo   %~nx0 /dev         # 开发模式启动
echo   %~nx0 /test        # 只运行测试
echo   %~nx0 /skip-test   # 跳过测试启动
goto :eof

:: 显示配置说明
:show_config_help
call :print_message "%BLUE%" "📧 邮箱配置说明:"
echo.
echo QQ邮箱配置:
echo   EMAIL_HOST=smtp.qq.com
echo   EMAIL_PORT=587
echo   EMAIL_USER=your-email@qq.com
echo   EMAIL_PASS=your-authorization-code  # QQ邮箱授权码，不是密码
echo.
echo Gmail配置:
echo   EMAIL_HOST=smtp.gmail.com
echo   EMAIL_PORT=587
echo   EMAIL_USER=your-email@gmail.com
echo   EMAIL_PASS=your-app-specific-password
echo.
echo 定时任务配置 (可选):
echo   CRON_SCHEDULE=0 8 * * *  # 每天早上8点
echo.
call :print_warning "请编辑.env文件完成配置后重新运行此脚本"
goto :eof

:: 主函数
:main
set "dev_mode=false"
set "test_only=false"
set "skip_test=false"

:: 解析命令行参数
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="/h" goto :show_help
if /i "%~1"=="/help" goto :show_help
if /i "%~1"=="/d" set "dev_mode=true" & shift & goto :parse_args
if /i "%~1"=="/dev" set "dev_mode=true" & shift & goto :parse_args
if /i "%~1"=="/t" set "test_only=true" & shift & goto :parse_args
if /i "%~1"=="/test" set "test_only=true" & shift & goto :parse_args
if /i "%~1"=="/s" set "skip_test=true" & shift & goto :parse_args
if /i "%~1"=="/skip-test" set "skip_test=true" & shift & goto :parse_args

call :print_error "未知参数: %~1"
call :show_usage
exit /b 1

:show_help
call :show_usage
exit /b 0

:args_done

call :print_header

:: 环境检查
call :check_nodejs
if %errorlevel% neq 0 exit /b 1
call :check_npm
if %errorlevel% neq 0 exit /b 1

:: 安装依赖
call :install_dependencies
if %errorlevel% neq 0 exit /b 1

:: 检查环境变量
call :check_env_file

:: 如果环境变量配置不完整，显示帮助并退出
call :validate_env
if %errorlevel% neq 0 (
    call :show_config_help
    exit /b 1
)

:: 运行测试
if "%test_only%"=="true" (
    call :run_tests
    exit /b %errorlevel%
) else if "%skip_test%"=="false" (
    call :run_tests
)

:: 如果只是测试模式，到这里就结束了
if "%test_only%"=="true" (
    call :print_success "测试完成"
    exit /b 0
)

:: 启动服务
if "%dev_mode%"=="true" (
    call :start_service "dev"
) else (
    call :start_service "prod"
)

goto :eof

:: 调用主函数
call :main %*