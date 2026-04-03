#!/usr/bin/env node

/**
 * Local Development Setup Script
 * This script helps set up the local D1 database and KV namespace for development
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏗️  Setting up local Housing Editor development environment...\n');

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

// Function to update wrangler.toml with actual IDs
function updateWranglerConfig(databaseId, kvId) {
  const wranglerPath = path.join(__dirname, 'wrangler.toml');
  let content = fs.readFileSync(wranglerPath, 'utf8');

  // Replace placeholder IDs with actual ones
  content = content.replace('database_id = "local-database-id"', `database_id = "${databaseId}"`);
  content = content.replace('id = "local-kv-namespace-id"', `id = "${kvId}"`);
  content = content.replace('preview_id = "local-kv-preview-id"', `preview_id = "${kvId}"`);

  fs.writeFileSync(wranglerPath, content);
  console.log('✅ Updated wrangler.toml with actual database and KV IDs');
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

    // Step 1: Create D1 database
    console.log('\n📦 Step 1: Creating local D1 database');
    const dbOutput = runCommand('wrangler d1 create housing-editor-local', 'Creating D1 database');
    
    // Extract database ID from output
    const dbIdMatch = dbOutput.match(/database_id = "(.+)"/);
    if (!dbIdMatch) {
      console.error('❌ Could not extract database ID from wrangler output');
      process.exit(1);
    }
    const databaseId = dbIdMatch[1];
    console.log(`📋 Database ID: ${databaseId}`);

    // Step 2: Initialize database schema
    console.log('\n🗄️  Step 2: Initializing database schema');
    runCommand('wrangler d1 execute housing-editor-local --local --file=schema.sql', 'Initializing database schema');

    // Step 3: Create KV namespace
    console.log('\n🗂️  Step 3: Creating KV namespace');
    const kvOutput = runCommand('wrangler kv:namespace create "HOUSING_EDITOR_KV" --preview', 'Creating KV namespace');
    
    // Extract KV ID from output
    const kvIdMatch = kvOutput.match(/id = "(.+)"/);
    if (!kvIdMatch) {
      console.error('❌ Could not extract KV ID from wrangler output');
      process.exit(1);
    }
    const kvId = kvIdMatch[1];
    console.log(`🗂️  KV ID: ${kvId}`);

    // Step 4: Update wrangler.toml with actual IDs
    console.log('\n⚙️  Step 4: Updating configuration');
    updateWranglerConfig(databaseId, kvId);

    // Step 5: Create .env.local file for development
    console.log('\n🔧 Step 5: Creating environment file');
    const envContent = `# Local Development Environment
VITE_API_URL=http://localhost:8787
JWT_SECRET=local-dev-secret-key-change-in-production

# Database and KV are configured in wrangler.toml
# DB binding: "DB" -> housing-editor-local
# KV binding: "KV" -> HOUSING_EDITOR_KV
`;

    fs.writeFileSync(path.join(__dirname, '.env.local'), envContent);
    console.log('✅ Created .env.local file');

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the worker: npm run worker:dev');
    console.log('2. In another terminal, start the frontend: npm run dev');
    console.log('3. Open http://localhost:5173 to access the application');
    console.log('\n📚 Useful commands:');
    console.log('- npm run worker:dev    - Start the API worker');
    console.log('- npm run dev           - Start the frontend dev server');
    console.log('- npm run db:migrate     - Re-run database migrations');
    console.log('- npm run worker:logs    - View worker logs');

  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setup();
