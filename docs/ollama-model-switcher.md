# Ollama 模型切换工具

这个工具允许您在本地和云端 Ollama 模型之间轻松切换，并管理云端模型配置。

## 功能特性

- 🔄 在本地和云端模型之间切换
- ➕ 添加云端 Ollama 服务
- 📋 查看所有可用的模型
- 🔧 管理云端模型配置
- 🧪 测试连接状态

## 使用方法

### 基本命令

```bash
# 启动模型切换工具
npm run switch-model

# 或者使用简写命令
npm run model
```

### 可用操作

运行命令后，您将看到以下选项：

1. **🔄 切换到本地模型** - 选择并切换到本地 Ollama 模型
2. **☁️ 切换到云端模型** - 选择并切换到云端 Ollama 模型
3. **➕ 添加云端模型** - 配置新的云端 Ollama 服务
4. **📋 列出所有模型** - 显示当前配置和所有可用模型
5. **🔧 管理云端模型** - 管理已保存的云端模型配置
6. **🧪 测试连接** - 测试本地和云端 Ollama 连接

## 添加云端模型

当选择"添加云端模型"时，您需要提供以下信息：

- **云端 Ollama 服务 URL**: 云端服务的完整 URL（例如：`https://your-ollama-instance.com`）
- **API 密钥**: 如果服务需要认证，请提供 API 密钥（可选）
- **默认模型名称**: 要使用的默认模型（例如：`llama2`）

### 云端服务示例

一些常见的云端 Ollama 服务：

- **Ollama AI Cloud**: `https://api.ollama.ai`
- **自定义托管**: `https://your-domain.com/ollama`
- **本地网络**: `http://192.168.1.100:11434`

## 配置文件

工具会修改以下配置文件：

### `config/ollama.json`

```json
{
  "apiUrl": "http://localhost:11434/api",
  "model": "llama2",
  "timeout": 30000,
  "cloudConfig": {
    "enabled": true,
    "url": "https://your-cloud-ollama.com",
    "apiKey": "your-api-key",
    "model": "llama2"
  },
  "cloudModels": [
    {
      "name": "我的云端模型",
      "url": "https://api.ollama.example.com",
      "apiKey": "optional-api-key",
      "model": "llama2"
    }
  ]
}
```

### `.env` 文件

工具会自动更新环境变量：

```env
OLLAMA_API_URL=http://localhost:11434/api
OLLAMA_MODEL=llama2
```

## 常见使用场景

### 场景 1: 切换到本地模型

1. 运行 `npm run model`
2. 选择"🔄 切换到本地模型"
3. 从列表中选择一个本地模型
4. 确认切换

### 场景 2: 配置云端模型

1. 运行 `npm run model`
2. 选择"➕ 添加云端模型"
3. 输入云端服务 URL 和其他信息
4. 等待连接测试
5. 确认配置

### 场景 3: 查看所有模型

1. 运行 `npm run model`
2. 选择"📋 列出所有模型"
3. 查看当前配置和可用模型列表

## 故障排除

### 连接失败

如果遇到连接问题：

1. **检查 URL**: 确保云端服务 URL 正确
2. **验证 API 密钥**: 如果服务需要认证，检查 API 密钥
3. **网络问题**: 确保可以访问云端服务
4. **服务状态**: 确认云端 Ollama 服务正在运行

### 本地模型未找到

如果看不到本地模型：

1. **启动 Ollama**: 确保 Ollama 服务正在运行
2. **检查端口**: 默认端口是 11434
3. **下载模型**: 使用 `ollama pull <模型名>` 下载模型

### 权限问题

如果遇到权限错误：

1. **检查文件权限**: 确保可以修改配置文件
2. **运行权限**: 使用适当的权限运行命令

## 环境变量

工具使用以下环境变量：

- `OLLAMA_API_URL`: 本地 Ollama API URL
- `OLLAMA_MODEL`: 当前选择的模型
- `NODE_ENV`: Node.js 环境

## API 参考

### ModelSwitcher 类

主要的模型切换器类，提供以下方法：

- `run()`: 启动交互式工具
- `loadConfig()`: 加载配置文件
- `saveConfig()`: 保存配置文件
- `getLocalModels()`: 获取本地模型列表
- `getCloudModels()`: 获取云端模型列表
- `testConnection()`: 测试连接状态

## 贡献

如果您想贡献代码或报告问题，请：

1. 检查现有的 issues
2. 创建新的 issue 描述问题
3. 提交 Pull Request

## 许可证

MIT License