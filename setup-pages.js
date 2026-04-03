#!/usr/bin/env node

/**
 * Pages Deployment Setup Script
 * This script sets up D1 database and KV for Cloudflare Pages deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Housing Editor for Cloudflare Pages deployment...\n');

// Function to execute command and handle errors
function runCommand(command, description) {
  try {
    console.log(`⚡ ${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    if (error.stdout) console.log('Output:', error.stdout);
    if (error.stderr) console.log('Error:', error.stderr);
    process.exit(1);
  }
}

async function setup() {
  try {
    // Check if wrangler is installed
    try {
      execSync('wrangler --version', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ Wrangler CLI is not installed. Please run: npm install -g wrangler');
      process.exit(1);
    }

    // Step 1: Initialize database schema
    console.log('\n🗄️  Step 1: Initializing D1 database schema');
    runCommand('wrangler d1 execute housing-editor --file=schema.sql', 'Initializing database schema');

    // Step 2: Verify KV namespace exists
    console.log('\n🗂️  Step 2: Verifying KV namespace');
    try {
      runCommand('wrangler kv namespace list', 'Listing KV namespaces');
      console.log('✅ KV namespace is accessible');
    } catch (error) {
      console.log('⚠️  KV namespace verification failed, but continuing...');
      console.log('   This is usually fine if the namespace is already bound in wrangler.toml');
    }

    // Step 3: Create .env.production file
    console.log('\n🔧 Step 3: Creating production environment file');
    const envContent = `# Production Environment for Pages
VITE_API_URL=https://housing-editor.pages.dev/api

# Database and KV are configured in wrangler.toml
# DB binding: "DB" -> housing-editor
# KV binding: "KV" -> c675420dfbbe46e7937fa8043c5d9ef6
`;

    fs.writeFileSync(path.join(__dirname, '.env.production'), envContent);
    console.log('✅ Created .env.production file');

    // Step 4: Test database connection
    console.log('\n🧪 Step 4: Testing database connection');
    const testResult = runCommand('wrangler d1 execute housing-editor --command "SELECT COUNT(*) as count FROM users;"', 'Testing database');
    console.log('✅ Database connection successful');

    console.log('\n🎉 Pages setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Build and deploy: npm run pages:deploy');
    console.log('2. Or test locally: npm run pages:dev');
    console.log('3. Visit: https://housing-editor.pages.dev');
    console.log('\n📚 Useful commands:');
    console.log('- npm run pages:deploy   - Build and deploy to Pages');
    console.log('- npm run pages:dev      - Local Pages development');
    console.log('- npm run db:migrate     - Re-run database migrations');
    console.log('- npm run db:backup      - Backup database');
    console.log('- npm run logs           - View deployment logs');

  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setup();
