# Claude Code Setup - Ollama Configuration

这个项目提供了一个完整的Claude Code开发环境配置，支持使用Ollama作为本地AI服务。

## 🚀 快速开始

### 1. 环境准备

确保你已经安装了：
- Node.js 16+
- Git
- Ollama (如果使用本地Ollama)

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 到 `.env` 并根据需要修改：

```bash
cp .env.example .env
```

主要配置项：
- `OLLAMA_API_URL`: Ollama API地址 (默认: http://localhost:11434)
- `OLLAMA_MODEL`: 使用的模型 (默认: minimax-m2:cloud)

### 4. 验证配置

运行验证脚本检查配置：

```bash
npm run verify
```

运行Ollama测试脚本：

```bash
npm test
# 或者
node test-ollama.js
```

## 📋 可用脚本

- `npm run setup`: 运行完整的项目设置
- `npm run verify`: 验证配置和依赖
- `npm test`: 测试Ollama连接

## 🦙 Ollama 配置

### 当前配置

项目已配置为使用 `minimax-m2:cloud` 模型，这是一个云托管的模型。

### 可用模型

根据你的Ollama服务，可用模型可能包括：
- minimax-m2:cloud
- qwen3-vl:235b-cloud
- gpt-oss:120b-cloud
- glm-4.6:cloud

### 切换模型

要切换到其他模型，修改 `.env` 文件中的 `OLLAMA_MODEL` 变量：

```env
OLLAMA_MODEL=qwen3-vl:235b-cloud
```

### 使用本地模型

如果你有本地Ollama服务，可以下载其他模型：

```bash
# 下载llama2模型
ollama pull llama2

# 然后更新.env文件
OLLAMA_MODEL=llama2
```

## 📁 项目结构

```
├── config/                 # 配置文件目录
│   ├── claude.json        # Claude API配置
│   ├── ollama.json        # Ollama API配置
│   ├── workspace.json     # 工作区配置
│   └── editor.json        # 编辑器配置
├── scripts/               # 脚本目录
│   ├── setup.js          # 项目设置脚本
│   └── verify.js         # 配置验证脚本
├── templates/            # 项目模板
│   ├── node-project/     # Node.js项目模板
│   ├── python-project/   # Python项目模板
│   ├── web-app/          # Web应用模板
│   └── cli-tool/         # CLI工具模板
├── docs/                 # 文档目录
├── projects/             # 项目目录
├── logs/                 # 日志目录
└── .cache/              # 缓存目录
```

## 🔧 故障排除

### Ollama连接问题

如果遇到连接问题：

1. **检查Ollama是否运行**：
   ```bash
   ollama serve
   ```

2. **检查API地址**：
   确保 `OLLAMA_API_URL` 正确指向你的Ollama服务

3. **检查模型可用性**：
   ```bash
   ollama list
   ```

### 模型问题

如果指定的模型不可用：

1. **查看可用模型**：
   ```bash
   node test-ollama.js
   ```

2. **下载新模型**：
   ```bash
   ollama pull <model-name>
   ```

3. **更新配置**：
   修改 `.env` 文件中的 `OLLAMA_MODEL`

## 📝 使用示例

### 基本API调用

```javascript
const axios = require('axios');
require('dotenv').config();

async function chatWithOllama(message) {
  const response = await axios.post(`${process.env.OLLAMA_API_URL}/api/chat`, {
    model: process.env.OLLAMA_MODEL,
    messages: [{ role: 'user', content: message }],
    stream: false
  });
  
  return response.data.message.content;
}
```

### 流式响应

```javascript
async function streamChat(message) {
  const response = await axios.post(`${process.env.OLLAMA_API_URL}/api/chat`, {
    model: process.env.OLLAMA_MODEL,
    messages: [{ role: 'user', content: message }],
    stream: true
  }, { responseType: 'stream' });
  
  response.data.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        const data = JSON.parse(line);
        if (data.message?.content) {
          process.stdout.write(data.message.content);
        }
      }
    }
  });
}
```

## 🤝 贡献

欢迎提交问题和改进建议！

## 📄 许可证

MIT License