# Ollama 云端模型快速开始

## 🚀 快速添加云端模型

### 1. 运行模型切换工具
```bash
npm run switch-model
```

### 2. 添加云端模型
- 选择选项 `3` (➕ 添加云端模型)
- 输入云端服务 URL (例如: `https://your-ollama-service.com`)
- 输入 API 密钥 (可选)
- 输入默认模型名称 (例如: `llama2`)

### 3. 切换到云端模型
- 选择选项 `2` (☁️ 切换到云端模型)
- 从列表中选择要使用的云端模型

## 📋 常用命令

```bash
# 切换模型
npm run switch-model

# 添加云端模型
npm run add-cloud-model

# 列出所有可用模型
npm run list-models

# 测试连接
npm run test-ollama
```

## 🔧 配置文件

云端配置保存在 `config/ollama.json`:

```json
{
  "cloudConfig": {
    "enabled": true,
    "url": "https://your-ollama-service.com",
    "apiKey": "your-api-key",
    "model": "llama2"
  }
}
```

## 🌐 支持的云端服务

- **Ollama Cloud**: 任何兼容 Ollama API 的服务
- **自定义服务**: 自托管的 Ollama 实例
- **第三方服务**: 提供 Ollama 兼容 API 的平台

## ⚡ 一键切换

使用 `cc switch` 命令快速切换模式：
- `cc switch local` - 切换到本地模型
- `cc switch cloud` - 切换到云端模型
- `cc switch` - 交互式选择

## 🛠️ 故障排除

1. **连接失败**: 检查 URL 和 API 密钥
2. **模型不存在**: 确认云端服务上有该模型
3. **权限问题**: 验证 API 密钥权限

---

更多详细信息请查看 [docs/ollama-model-switcher.md](docs/ollama-model-switcher.md)