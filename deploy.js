#!/usr/bin/env node

/**
 * Cloudflare Pages 部署脚本
 * 用于一键构建并部署 EconGrapher 到 Cloudflare Pages
 * 
 * 使用方法:
 *   node deploy.js           # 部署到生产环境
 *   node deploy.js --preview # 部署到预览环境
 * 
 * @author EconGrapher Team
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_NAME = 'EconGrapher';
const OUTPUT_DIR = 'out';

/**
 * 执行命令并实时输出
 * @param {string} command - 要执行的命令
 * @param {string} description - 命令描述
 */
function runCommand(command, description) {
  console.log(`\n� ${description}...`);
  console.log(`   执行: ${command}\n`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} 完成\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} 失败`);
    console.error(error.message);
    return false;
  }
}

/**
 * 检查 wrangler 是否已登录
 */
function checkAuth() {
  try {
    execSync('npx wrangler whoami', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 主部署流程
 */
async function deploy() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview');
  
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     🚀 EconGrapher 部署脚本                ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log(`📋 项目名称: ${PROJECT_NAME}`);
  console.log(`📋 部署模式: ${isPreview ? '预览环境' : '生产环境'}`);
  console.log(`📋 输出目录: ${OUTPUT_DIR}\n`);

  // 检查认证状态
  console.log('🔐 检查 Cloudflare 认证状态...');
  if (!checkAuth()) {
    console.log('⚠️  未检测到 Cloudflare 认证信息');
    console.log('   请运行以下命令进行登录:');
    console.log('   npx wrangler login\n');
    process.exit(1);
  }
  console.log('✅ 已认证\n');

  // 清理旧的构建输出
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log('🧹 清理旧的构建输出...');
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    console.log('✅ 清理完成\n');
  }

  // 构建项目
  if (!runCommand('npm run build', '构建 Next.js 项目')) {
    process.exit(1);
  }

  // 检查构建输出
  if (!fs.existsSync(OUTPUT_DIR)) {
    console.error('❌ 构建输出目录不存在，请检查构建配置');
    process.exit(1);
  }

  // 部署到 Cloudflare Pages
  const deployCommand = isPreview 
    ? `npx wrangler pages deploy ${OUTPUT_DIR} --project-name=${PROJECT_NAME}`
    : `npx wrangler pages deploy ${OUTPUT_DIR} --project-name=${PROJECT_NAME} --branch=main`;

  if (!runCommand(deployCommand, `部署到 Cloudflare Pages (${isPreview ? '预览' : '生产'})`)) {
    process.exit(1);
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║           🎉 部署成功完成!                  ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  console.log('📍 访问地址:');
  console.log(`   https://${PROJECT_NAME.toLowerCase()}.pages.dev`);
  console.log('\n📊 Cloudflare Dashboard:');
  console.log(`   https://dash.cloudflare.com/?to=/:account/pages/view/${PROJECT_NAME}\n`);
}

deploy().catch(error => {
  console.error('❌ 部署过程中发生错误:', error);
  process.exit(1);
});
