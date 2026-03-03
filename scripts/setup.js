#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
require('dotenv').config();

class Setup {
  constructor() {
    this.rootDir = path.resolve(__dirname, '..');
    this.configDir = path.join(this.rootDir, 'config');
    this.templatesDir = path.join(this.rootDir, 'templates');
  }

  async run() {
    console.log(chalk.blue.bold('🚀 Claude Code Setup'));
    console.log(chalk.gray('Initializing your development environment...\n'));

    try {
      await this.checkEnvironment();
      await this.createDirectories();
      await this.setupEnvironmentFile();
      await this.createVSCodeSettings();
      await this.installDependencies();
      await this.verifySetup();

      console.log(chalk.green.bold('\n✅ Setup completed successfully!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log(chalk.white('1. Edit .env file with your API keys'));
      console.log(chalk.white('2. Run npm run verify to check configuration'));
      console.log(chalk.white('3. Start building with npm run create <template> <project>'));

    } catch (error) {
      console.error(chalk.red.bold('\n❌ Setup failed:'), error.message);
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
        throw new Error(`Node.js ${majorVersion} detected. Version 16+ required.`);
      }

      // Check if git is available
      const { execSync } = require('child_process');
      try {
        execSync('git --version', { stdio: 'ignore' });
      } catch {
        throw new Error('Git is not installed or not in PATH');
      }

      spinner.succeed('Environment check passed');
    } catch (error) {
      spinner.fail('Environment check failed');
      throw error;
    }
  }

  async createDirectories() {
    const spinner = ora('Creating directory structure...').start();
    
    const directories = [
      'projects',
      'logs',
      '.cache',
      '.vscode',
      'scripts',
      'config',
      'templates',
      'docs',
      'templates/node-project/src',
      'templates/python-project/src',
      'templates/web-app/src',
      'templates/cli-tool/src'
    ];

    try {
      for (const dir of directories) {
        await fs.ensureDir(path.join(this.rootDir, dir));
      }
      spinner.succeed('Directory structure created');
    } catch (error) {
      spinner.fail('Failed to create directories');
      throw error;
    }
  }

  async setupEnvironmentFile() {
    const spinner = ora('Setting up environment configuration...').start();
    
    const envPath = path.join(this.rootDir, '.env');
    const envExamplePath = path.join(this.rootDir, '.env.example');

    try {
      if (!await fs.pathExists(envPath)) {
        await fs.copy(envExamplePath, envPath);
        spinner.succeed('Environment file created (.env)');
      } else {
        spinner.succeed('Environment file already exists');
      }
    } catch (error) {
      spinner.fail('Failed to setup environment file');
      throw error;
    }
  }

  async createVSCodeSettings() {
    const spinner = ora('Creating VS Code settings...').start();
    
    const vscodeDir = path.join(this.rootDir, '.vscode');
    const settingsPath = path.join(vscodeDir, 'settings.json');
    const extensionsPath = path.join(vscodeDir, 'extensions.json');

    try {
      // Load editor config
      const editorConfig = await fs.readJSON(path.join(this.configDir, 'editor.json'));
      
      // Create settings.json
      await fs.writeJSON(settingsPath, editorConfig.vscode.settings, { spaces: 2 });
      
      // Create extensions.json
      const extensionsJson = {
        recommendations: editorConfig.vscode.extensions.recommended
      };
      await fs.writeJSON(extensionsPath, extensionsJson, { spaces: 2 });
      
      spinner.succeed('VS Code settings created');
    } catch (error) {
      spinner.fail('Failed to create VS Code settings');
      throw error;
    }
  }

  async installDependencies() {
    const spinner = ora('Installing dependencies...').start();
    
    try {
      const { execSync } = require('child_process');
      execSync('npm install', { 
        stdio: 'pipe',
        cwd: this.rootDir 
      });
      spinner.succeed('Dependencies installed');
    } catch (error) {
      spinner.fail('Failed to install dependencies');
      throw error;
    }
  }

  async verifySetup() {
    const spinner = ora('Verifying setup...').start();
    
    try {
      const requiredFiles = [
        '.env.example',
        'package.json',
        'README.md',
        'config/claude.json',
        'config/workspace.json',
        'config/editor.json'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(this.rootDir, file);
        if (!await fs.pathExists(filePath)) {
          throw new Error(`Missing required file: ${file}`);
        }
      }

      spinner.succeed('Setup verification passed');
    } catch (error) {
      spinner.fail('Setup verification failed');
      throw error;
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new Setup();
  setup.run().catch(console.error);
}

module.exports = Setup;