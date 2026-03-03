#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { default: chalk } = require('chalk');
const ora = require('ora').default;
const axios = require('axios');
require('dotenv').config();

class Verify {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.configDir = path.join(this.rootDir, 'config');
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log(chalk.blue.bold('🔍 Claude Code Verification'));
    console.log(chalk.gray('Checking your configuration...\n'));

    try {
      await this.checkEnvironment();
      await this.checkConfigFiles();
      await this.checkEnvironmentVariables();
      await this.checkApiConnections();
      await this.checkTemplates();
      await this.checkDirectories();
      await this.checkDependencies();

      this.printResults();

      if (this.errors.length > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Verification failed:'), error.message);
      process.exit(1);
    }
  }

  async checkEnvironment() {
    const spinner = ora('Checking environment...').start();
    
    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion < 16) {
        this.errors.push(`Node.js ${majorVersion} detected. Version 16+ required.`);
      }

      // Check npm
      const { execSync } = require('child_process');
      try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        spinner.text = `Node.js ${nodeVersion}, npm ${npmVersion}`;
      } catch {
        this.errors.push('npm is not installed or not in PATH');
      }

      // Check Python (optional)
      try {
        const pythonVersion = execSync('python --version', { encoding: 'utf8' }).trim();
        spinner.text += `, Python ${pythonVersion}`;
      } catch {
        this.warnings.push('Python is not installed (optional for Python projects)');
      }

      // Check Git
      try {
        const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
        spinner.text += `, Git ${gitVersion.replace('git version ', '')}`;
        spinner.succeed('Environment check completed');
      } catch {
        this.errors.push('Git is not installed or not in PATH');
      }

    } catch (error) {
      spinner.fail('Environment check failed');
      throw error;
    }
  }

  async checkConfigFiles() {
    const spinner = ora('Checking configuration files...').start();
    
    const requiredConfigs = [
      'claude.json',
      'workspace.json',
      'editor.json',
      'ollama.json'
    ];

    try {
      for (const config of requiredConfigs) {
        const configPath = path.join(this.configDir, config);
        if (!await fs.pathExists(configPath)) {
          this.errors.push(`Missing config file: ${config}`);
        } else {
          try {
            await fs.readJSON(configPath);
          } catch {
            this.errors.push(`Invalid JSON in config file: ${config}`);
          }
        }
      }

      spinner.succeed('Configuration files checked');
    } catch (error) {
      spinner.fail('Failed to check configuration files');
      throw error;
    }
  }

  async checkEnvironmentVariables() {
    const spinner = ora('Checking environment variables...').start();
    
    const envPath = path.join(this.rootDir, '.env');
    
    try {
      if (!await fs.pathExists(envPath)) {
        this.warnings.push('.env file not found (using .env.example)');
        return;
      }

      const envContent = await fs.readFile(envPath, 'utf8');
      const envVars = envContent.split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.split('=')[0]);

      const criticalVars = [
        'OLLAMA_API_URL',
        'OLLAMA_MODEL',
        'NODE_ENV',
        'WORKSPACE_PATH'
      ];

      for (const varName of criticalVars) {
        if (!envVars.includes(varName)) {
          this.warnings.push(`Environment variable not set: ${varName}`);
        }
      }

      // Check if API key is placeholder
      if (process.env.ANTHROPIC_API_KEY && 
          process.env.ANTHROPIC_API_KEY.includes('your_')) {
        this.warnings.push('ANTHROPIC_API_KEY appears to be a placeholder');
      }

      spinner.succeed('Environment variables checked');
    } catch (error) {
      spinner.fail('Failed to check environment variables');
      throw error;
    }
  }

  async checkApiConnections() {
    const spinner = ora('Checking API connections...').start();
    
    try {
      // Check Ollama API first
      if (process.env.OLLAMA_API_URL) {
        try {
          const ollamaResponse = await axios.get(
            `${process.env.OLLAMA_API_URL}/api/tags`,
            { timeout: 10000 }
          );
          spinner.text = 'Ollama API: ✓';
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            this.errors.push('Ollama API: Connection refused - is Ollama running?');
          } else {
            this.warnings.push(`Ollama API: ${error.message}`);
          }
        }
      } else {
        this.warnings.push('Ollama API: Not configured');
      }

      // Check Claude API
      if (process.env.ANTHROPIC_API_KEY && 
          !process.env.ANTHROPIC_API_KEY.includes('your_')) {
        
        try {
          const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
              },
              timeout: 10000
            }
          );
          spinner.text += ', Claude API: ✓';
        } catch (error) {
          if (error.response?.status === 401) {
            this.warnings.push('Claude API: Invalid API key');
          } else if (error.code === 'ECONNREFUSED') {
            this.warnings.push('Claude API: Connection failed (network issue)');
          } else {
            this.warnings.push(`Claude API: ${error.message}`);
          }
        }
      } else {
        this.warnings.push('Claude API: No valid API key configured');
      }

      spinner.succeed('API connections checked');
    } catch (error) {
      spinner.fail('Failed to check API connections');
      throw error;
    }
  }

  async checkTemplates() {
    const spinner = ora('Checking project templates...').start();
    
    const templatesDir = path.join(this.rootDir, 'templates');
    const requiredTemplates = ['node-project', 'python-project', 'web-app', 'cli-tool'];
    
    try {
      for (const template of requiredTemplates) {
        const templatePath = path.join(templatesDir, template);
        if (!await fs.pathExists(templatePath)) {
          this.warnings.push(`Missing template: ${template}`);
          continue;
        }

        // Check template structure
        if (template === 'node-project') {
          const packageJsonPath = path.join(templatePath, 'package.json');
          if (!await fs.pathExists(packageJsonPath)) {
            this.warnings.push(`Node.js template missing package.json`);
          }
        } else if (template === 'python-project') {
          const requirementsPath = path.join(templatePath, 'requirements.txt');
          if (!await fs.pathExists(requirementsPath)) {
            this.warnings.push(`Python template missing requirements.txt`);
          }
        }
      }

      spinner.succeed('Project templates checked');
    } catch (error) {
      spinner.fail('Failed to check project templates');
      throw error;
    }
  }

  async checkDirectories() {
    const spinner = ora('Checking directory structure...').start();
    
    const requiredDirs = [
      'config',
      'scripts',
      'templates',
      'docs',
      'projects',
      'logs',
      '.cache'
    ];

    try {
      for (const dir of requiredDirs) {
        const dirPath = path.join(this.rootDir, dir);
        if (!await fs.pathExists(dirPath)) {
          this.warnings.push(`Missing directory: ${dir}`);
        }
      }

      spinner.succeed('Directory structure checked');
    } catch (error) {
      spinner.fail('Failed to check directory structure');
      throw error;
    }
  }

  async checkDependencies() {
    const spinner = ora('Checking dependencies...').start();
    
    try {
      const packageJsonPath = path.join(this.rootDir, 'package.json');
      const nodeModulesPath = path.join(this.rootDir, 'node_modules');

      if (!await fs.pathExists(packageJsonPath)) {
        this.errors.push('package.json not found');
        return;
      }

      if (!await fs.pathExists(nodeModulesPath)) {
        this.warnings.push('node_modules not found - run npm install');
      }

      // Check if key dependencies are installed
      const packageJson = await fs.readJSON(packageJsonPath);
      const keyDeps = ['chalk', 'inquirer', 'ora', 'axios', 'fs-extra'];

      for (const dep of keyDeps) {
        if (!packageJson.dependencies[dep]) {
          this.warnings.push(`Missing dependency: ${dep}`);
        }
      }

      spinner.succeed('Dependencies checked');
    } catch (error) {
      spinner.fail('Failed to check dependencies');
      throw error;
    }
  }

  printResults() {
    console.log('\n' + chalk.blue.bold('📊 Verification Results'));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green.bold('\n✅ All checks passed! Your configuration is ready.'));
      return;
    }

    if (this.errors.length > 0) {
      console.log(chalk.red.bold('\n❌ Errors:'));
      this.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  Warnings:'));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`  • ${warning}`));
      });
    }

    if (this.errors.length > 0) {
      console.log(chalk.red.bold('\n🔧 Please fix the errors above before proceeding.'));
    } else if (this.warnings.length > 0) {
      console.log(chalk.cyan.bold('\n💡 Consider addressing the warnings for optimal performance.'));
    }
  }
}

// Run verification if called directly
if (require.main === module) {
  const verify = new Verify();
  verify.run().catch(console.error);
}

module.exports = Verify;