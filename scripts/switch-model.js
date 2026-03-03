#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const axios = require('axios');
require('dotenv').config();

// 简单的颜色输出函数
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  blueBold: (text) => `\x1b[1;34m${text}\x1b[0m`,
  greenBold: (text) => `\x1b[1;32m${text}\x1b[0m`,
  yellowBold: (text) => `\x1b[1;33m${text}\x1b[0m`,
  redBold: (text) => `\x1b[1;31m${text}\x1b[0m`,
  cyanBold: (text) => `\x1b[1;36m${text}\x1b[0m`
};

class ModelSwitcher {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.configDir = path.join(this.rootDir, 'config');
    this.ollamaConfigPath = path.join(this.configDir, 'ollama.json');
    this.envPath = path.join(this.rootDir, '.env');
  }

  async run() {
    console.log(colors.blueBold('🦙 Ollama 模型切换工具'));
    console.log(colors.gray('管理本地和云端 Ollama 模型...\n'));

    try {
      await this.loadConfig();
      const action = await this.selectAction();
      
      switch (action) {
        case 'switch-local':
          await this.switchToLocalModel();
          break;
        case 'switch-cloud':
          await this.switchToCloudModel();
          break;
        case 'add-cloud':
          await this.addCloudModel();
          break;
        case 'list-models':
          await this.listModels();
          break;
        case 'test-connection':
          await this.testConnection();
          break;
        case 'manage-cloud':
          await this.manageCloudModels();
          break;
      }

    } catch (error) {
      console.error(colors.redBold('\n❌ 操作失败:'), error.message);
      process.exit(1);
    }
  }

  async loadConfig() {
    try {
      this.config = await fs.readJSON(this.ollamaConfigPath);
      this.envVars = this.parseEnvFile();
    } catch (error) {
      throw new Error('无法加载配置文件');
    }
  }

  parseEnvFile() {
    if (!fs.existsSync(this.envPath)) {
      return {};
    }
    
    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          envVars[key.trim()] = values.join('=').trim();
        }
      }
    });
    
    return envVars;
  }

  async saveConfig() {
    await fs.writeJSON(this.ollamaConfigPath, this.config, { spaces: 2 });
  }

  async saveEnvVars() {
    const envContent = Object.entries(this.envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    await fs.writeFile(this.envPath, envContent);
  }

  async selectAction() {
    // 使用简单的命令行参数交互
    console.log(colors.cyan('请选择操作:'));
    console.log('1. 🔄 切换到本地模型');
    console.log('2. ☁️  切换到云端模型');
    console.log('3. ➕ 添加云端模型');
    console.log('4. 📋 列出所有模型');
    console.log('5. 🔧 管理云端模型');
    console.log('6. 🧪 测试连接');
    
    return new Promise((resolve, reject) => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\n请输入选项 (1-6): ', (answer) => {
        readline.close();
        
        const actions = {
          '1': 'switch-local',
          '2': 'switch-cloud',
          '3': 'add-cloud',
          '4': 'list-models',
          '5': 'manage-cloud',
          '6': 'test-connection'
        };
        
        if (actions[answer]) {
          resolve(actions[answer]);
        } else {
          reject(new Error('无效的选项'));
        }
      });
    });
  }

  async switchToLocalModel() {
    const spinner = ora('获取本地模型列表...').start();
    
    try {
      const localModels = await this.getLocalModels();
      spinner.succeed('找到本地模型');
      
      if (localModels.length === 0) {
        console.log(colors.yellow('⚠️  没有找到本地模型'));
        console.log(colors.cyan('提示: 使用 "ollama pull <模型名>" 下载模型'));
        return;
      }

      const selectedModel = await this.selectFromList('选择本地模型:', localModels);

      // 更新配置
      this.config.model = selectedModel;
      this.config.cloudConfig.enabled = false;
      this.envVars.OLLAMA_MODEL = selectedModel;
      
      await this.saveConfig();
      await this.saveEnvVars();
      
      console.log(colors.green(`✅ 已切换到本地模型: ${selectedModel}`));
      
    } catch (error) {
      spinner.fail('获取本地模型失败');
      throw error;
    }
  }

  async switchToCloudModel() {
    if (!this.config.cloudConfig.enabled || !this.config.cloudConfig.url) {
      console.log(colors.yellow('⚠️  没有配置云端模型'));
      console.log(colors.cyan('提示: 先使用 "添加云端模型" 功能'));
      return;
    }

    const spinner = ora('获取云端模型列表...').start();
    
    try {
      const cloudModels = await this.getCloudModels();
      spinner.succeed('找到云端模型');
      
      if (cloudModels.length === 0) {
        console.log(colors.yellow('⚠️  没有找到云端模型'));
        return;
      }

      const selectedModel = await this.selectFromList('选择云端模型:', cloudModels);

      // 更新配置
      this.config.model = selectedModel;
      this.config.cloudConfig.enabled = true;
      this.config.cloudConfig.model = selectedModel;
      this.envVars.OLLAMA_MODEL = selectedModel;
      
      await this.saveConfig();
      await this.saveEnvVars();
      
      console.log(colors.green(`✅ 已切换到云端模型: ${selectedModel}`));
      
    } catch (error) {
      spinner.fail('获取云端模型失败');
      throw error;
    }
  }

  async addCloudModel() {
    console.log(colors.cyan('📝 配置云端 Ollama 服务'));
    
    const answers = await this.promptForCloudConfig();

    // 测试连接
    const spinner = ora('测试云端连接...').start();
    try {
      const headers = {};
      if (answers.apiKey) {
        headers['Authorization'] = `Bearer ${answers.apiKey}`;
      }

      await axios.get(`${answers.url}/api/tags`, {
        headers,
        timeout: 10000
      });
      
      spinner.succeed('云端连接测试成功');
      
      // 更新配置
      this.config.cloudConfig = {
        enabled: true,
        url: answers.url,
        apiKey: answers.apiKey,
        model: answers.model
      };
      
      await this.saveConfig();
      
      console.log(colors.green('✅ 云端模型配置成功'));
      console.log(colors.cyan(`URL: ${answers.url}`));
      console.log(colors.cyan(`模型: ${answers.model}`));
      
    } catch (error) {
      spinner.fail('云端连接测试失败');
      console.log(colors.yellow('⚠️  仍然保存配置，但请检查连接'));
      
      this.config.cloudConfig = {
        enabled: true,
        url: answers.url,
        apiKey: answers.apiKey,
        model: answers.model
      };
      
      await this.saveConfig();
    }
  }

  async promptForCloudConfig() {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => {
      readline.question(prompt, resolve);
    });

    try {
      const url = await question(`云端 Ollama 服务 URL (${this.config.cloudConfig.url || ''}): `);
      const apiKey = await question(`API 密钥 (可选) (${this.config.cloudConfig.apiKey || ''}): `);
      const model = await question(`默认模型名称 (${this.config.cloudConfig.model || 'llama2'}): `);
      
      readline.close();
      
      return {
        url: url || this.config.cloudConfig.url || '',
        apiKey: apiKey || this.config.cloudConfig.apiKey || '',
        model: model || this.config.cloudConfig.model || 'llama2'
      };
    } catch (error) {
      readline.close();
      throw error;
    }
  }

  async selectFromList(prompt, choices) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(colors.cyan(prompt));
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice}`);
    });

    return new Promise((resolve, reject) => {
      readline.question('\n请输入选项: ', (answer) => {
        readline.close();
        
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < choices.length) {
          resolve(choices[index]);
        } else {
          reject(new Error('无效的选项'));
        }
      });
    });
  }

  async manageCloudModels() {
    console.log(colors.cyan('🔧 管理云端模型配置'));
    
    const cloudModels = this.config.cloudModels || [];
    
    if (cloudModels.length === 0) {
      console.log(colors.yellow('⚠️  没有保存的云端模型'));
      
      const shouldAdd = await this.confirm('是否添加新的云端模型?');
      
      if (shouldAdd) {
        await this.addCloudModel();
      }
      return;
    }

    console.log(colors.cyan('选择操作:'));
    console.log('1. 📋 查看所有云端模型');
    console.log('2. ➕ 添加新云端模型');
    console.log('3. 🗑️  删除云端模型');
    console.log('4. 🔄 编辑云端模型');
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const action = await new Promise((resolve) => {
      readline.question('\n请输入选项 (1-4): ', (answer) => {
        readline.close();
        
        const actions = {
          '1': 'list',
          '2': 'add',
          '3': 'delete',
          '4': 'edit'
        };
        
        resolve(actions[answer] || 'list');
      });
    });

    switch (action) {
      case 'list':
        await this.listCloudModels();
        break;
      case 'add':
        await this.addCloudModel();
        break;
      case 'delete':
        await this.deleteCloudModel();
        break;
      case 'edit':
        await this.editCloudModel();
        break;
    }
  }

  async confirm(message) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question(`${message} (y/N): `, (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async listCloudModels() {
    const cloudModels = this.config.cloudModels || [];
    
    if (cloudModels.length === 0) {
      console.log(colors.yellow('⚠️  没有保存的云端模型'));
      return;
    }

    console.log(colors.blueBold('\n📋 已保存的云端模型:'));
    cloudModels.forEach((model, index) => {
      console.log(colors.white(`${index + 1}. ${model.name}`));
      console.log(colors.gray(`   URL: ${model.url}`));
      console.log(colors.gray(`   模型: ${model.model}`));
      if (model.apiKey) {
        console.log(colors.gray(`   API Key: ${'*'.repeat(Math.min(model.apiKey.length, 10))}...`));
      }
      console.log();
    });
  }

  async deleteCloudModel() {
    const cloudModels = this.config.cloudModels || [];
    
    if (cloudModels.length === 0) {
      console.log(colors.yellow('⚠️  没有云端模型可删除'));
      return;
    }

    const modelToDelete = await this.selectFromList(
      '选择要删除的云端模型:',
      cloudModels.map(model => `${model.name} (${model.url})`)
    );

    const confirm = await this.confirm(`确定要删除 "${modelToDelete}" 吗?`);

    if (confirm) {
      const modelName = cloudModels.find(model => `${model.name} (${model.url})` === modelToDelete)?.name;
      if (modelName) {
        this.config.cloudModels = cloudModels.filter(model => model.name !== modelName);
        await this.saveConfig();
        console.log(colors.green(`✅ 已删除云端模型: ${modelName}`));
      }
    }
  }

  async editCloudModel() {
    const cloudModels = this.config.cloudModels || [];
    
    if (cloudModels.length === 0) {
      console.log(colors.yellow('⚠️  没有云端模型可编辑'));
      return;
    }

    const modelToEdit = await this.selectFromList(
      '选择要编辑的云端模型:',
      cloudModels.map(model => `${model.name} (${model.url})`)
    );

    const model = cloudModels.find(m => `${m.name} (${m.url})` === modelToEdit);
    if (!model) return;

    console.log(colors.cyan('编辑云端模型配置:'));
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => {
      readline.question(prompt, resolve);
    });

    try {
      const url = await question(`URL (${model.url}): `);
      const apiKey = await question(`API 密钥 (${model.apiKey || ''}): `);
      const modelName = await question(`模型名称 (${model.model}): `);
      
      readline.close();
      
      // 更新模型
      if (url) model.url = url;
      if (apiKey) model.apiKey = apiKey;
      if (modelName) model.model = modelName;
      
      await this.saveConfig();
      console.log(colors.green(`✅ 已更新云端模型: ${model.name}`));
    } catch (error) {
      readline.close();
      throw error;
    }
  }

  async listModels() {
    console.log(colors.blueBold('📋 模型列表'));
    
    // 显示当前配置
    console.log(colors.cyan('\n🔧 当前配置:'));
    console.log(colors.white(`模式: ${this.config.cloudConfig.enabled ? '云端' : '本地'}`));
    console.log(colors.white(`模型: ${this.config.model}`));
    
    if (this.config.cloudConfig.enabled) {
      console.log(colors.white(`云端 URL: ${this.config.cloudConfig.url}`));
    }
    console.log(colors.white(`本地 API: ${this.config.apiUrl}`));

    // 获取本地模型
    const spinner = ora('获取本地模型...').start();
    try {
      const localModels = await this.getLocalModels();
      spinner.succeed('本地模型获取成功');
      
      if (localModels.length > 0) {
        console.log(colors.cyan('\n🦙 本地模型:'));
        localModels.forEach(model => {
          const isCurrent = model === this.config.model && !this.config.cloudConfig.enabled;
          console.log(`${isCurrent ? colors.green('✓') : ' '} ${model}`);
        });
      } else {
        console.log(colors.yellow('\n🦙 本地模型: 无'));
      }
    } catch (error) {
      spinner.fail('获取本地模型失败');
      console.log(colors.yellow('\n🦙 本地模型: 连接失败'));
    }

    // 获取云端模型
    if (this.config.cloudConfig.url) {
      const cloudSpinner = ora('获取云端模型...').start();
      try {
        const cloudModels = await this.getCloudModels();
        cloudSpinner.succeed('云端模型获取成功');
        
        if (cloudModels.length > 0) {
          console.log(colors.cyan('\n☁️  云端模型:'));
          cloudModels.forEach(model => {
            const isCurrent = model === this.config.model && this.config.cloudConfig.enabled;
            console.log(`${isCurrent ? colors.green('✓') : ' '} ${model}`);
          });
        } else {
          console.log(colors.yellow('\n☁️  云端模型: 无'));
        }
      } catch (error) {
        cloudSpinner.fail('获取云端模型失败');
        console.log(colors.yellow('\n☁️  云端模型: 连接失败'));
      }
    }
  }

  async testConnection() {
    console.log(colors.cyan('🧪 测试连接'));
    
    // 测试本地连接
    console.log(colors.blue('\n🦙 测试本地 Ollama:'));
    const localSpinner = ora('连接中...').start();
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/tags`, {
        timeout: 10000
      });
      const models = response.data.models.map(m => m.name);
      localSpinner.succeed(`连接成功 (${models.length} 个模型)`);
      models.forEach(model => {
        console.log(colors.gray(`  - ${model}`));
      });
    } catch (error) {
      localSpinner.fail('连接失败');
      console.log(colors.red(`  错误: ${error.message}`));
    }

    // 测试云端连接
    if (this.config.cloudConfig.url) {
      console.log(colors.blue('\n☁️  测试云端 Ollama:'));
      const cloudSpinner = ora('连接中...').start();
      try {
        const headers = {};
        if (this.config.cloudConfig.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.cloudConfig.apiKey}`;
        }

        const response = await axios.get(`${this.config.cloudConfig.url}/api/tags`, {
          headers,
          timeout: 10000
        });
        const models = response.data.models.map(m => m.name);
        cloudSpinner.succeed(`连接成功 (${models.length} 个模型)`);
        models.forEach(model => {
          console.log(colors.gray(`  - ${model}`));
        });
      } catch (error) {
        cloudSpinner.fail('连接失败');
        console.log(colors.red(`  错误: ${error.message}`));
      }
    }
  }

  async getLocalModels() {
    try {
      const response = await axios.get(`${this.config.apiUrl}/api/tags`, {
        timeout: 10000
      });
      return response.data.models.map(m => m.name);
    } catch (error) {
      throw new Error(`无法获取本地模型: ${error.message}`);
    }
  }

  async getCloudModels() {
    if (!this.config.cloudConfig.url) {
      throw new Error('云端 URL 未配置');
    }

    try {
      const headers = {};
      if (this.config.cloudConfig.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.cloudConfig.apiKey}`;
      }

      const response = await axios.get(`${this.config.cloudConfig.url}/api/tags`, {
        headers,
        timeout: 10000
      });
      return response.data.models.map(m => m.name);
    } catch (error) {
      throw new Error(`无法获取云端模型: ${error.message}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const switcher = new ModelSwitcher();
  switcher.run().catch(console.error);
}

module.exports = ModelSwitcher;