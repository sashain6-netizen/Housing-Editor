# Local Development Setup

This guide will help you set up the Housing Editor for local development using D1 database and KV storage.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Wrangler CLI** - Install with: `npm install -g wrangler`
3. **Git** (for version control)

## Quick Setup

The easiest way to get started is to run the automated setup script:

```bash
node setup-local.js
```

This script will:
- Create a local D1 database
- Initialize the database schema
- Create a KV namespace for sessions
- Update `wrangler.toml` with the actual database and KV IDs
- Create a `.env.local` file with development settings

## Manual Setup

If you prefer to set up manually, follow these steps:

### 1. Create D1 Database

```bash
wrangler d1 create housing-editor-local
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[env.dev.d1_databases]]
binding = "DB"
database_name = "housing-editor-local"
database_id = "YOUR_DATABASE_ID_HERE"
```

### 2. Initialize Database Schema

```bash
wrangler d1 execute housing-editor-local --local --file=schema.sql
```

### 3. Create KV Namespace

```bash
wrangler kv:namespace create "HOUSING_EDITOR_KV" --preview
```

Copy the `id` from the output and update `wrangler.toml`:

```toml
[[env.dev.kv_namespaces]]
binding = "KV"
id = "YOUR_KV_ID_HERE"
preview_id = "YOUR_KV_ID_HERE"
```

### 4. Create Environment File

Create `.env.local` in the project root:

```env
VITE_API_URL=http://localhost:8787
JWT_SECRET=local-dev-secret-key-change-in-production
```

## Development Commands

### Starting the Application

1. **Start the API Worker** (in one terminal):
   ```bash
   npm run worker:dev
   ```

2. **Start the Frontend** (in another terminal):
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

### Database Operations

- **Initialize database**: `npm run db:init`
- **Run migrations**: `npm run db:migrate`
- **Create database**: `npm run db:create`

### KV Operations

- **Create KV namespace**: `npm run kv:create`

### Worker Operations

- **Start worker**: `npm run worker:dev`
- **View logs**: `npm run worker:logs`
- **Build worker**: `npm run worker:build`
- **Deploy to production**: `npm run worker:deploy`

## Architecture Overview

### Local Development Stack

- **Frontend**: Vite + React (port 5173)
- **Backend**: Cloudflare Worker with D1 + KV (port 8787)
- **Database**: Local D1 SQLite database
- **Cache**: Local KV namespace for sessions

### Database Schema

The local D1 database includes:
- `users` - User accounts and authentication
- `sessions` - JWT session management
- `houses` - HTSL project storage
- `activity_log` - User activity tracking

### API Endpoints

All endpoints are available at `http://localhost:8787`:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/houses` - List user houses
- `POST /api/houses` - Create new house
- `GET /api/houses/:id` - Get specific house
- `PUT /api/houses/:id` - Update house
- `DELETE /api/houses/:id` - Delete house
- `GET /api/health` - Health check

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 5173 and 8787 are available
2. **Database not found**: Run `npm run db:create` and `npm run db:init`
3. **KV namespace missing**: Run `npm run kv:create`
4. **Authentication errors**: Check that the worker is running and accessible

### Resetting Local Environment

To completely reset your local development environment:

```bash
# Remove local database
wrangler d1 delete housing-editor-local --local

# Remove local KV (if needed)
# Note: KV namespaces are global and may need manual cleanup

# Re-run setup
node setup-local.js
```

### Database Access

You can query the local database directly:

```bash
# Interactive SQL shell
wrangler d1 execute housing-editor-local --local --command "SELECT * FROM users;"

# Run SQL from file
wrangler d1 execute housing-editor-local --local --file=queries.sql
```

## Production Deployment

When you're ready to deploy to production:

1. Update production environment variables in `wrangler.toml`
2. Create production D1 database and KV namespace
3. Run: `npm run worker:deploy`

The production configuration is already set up in `wrangler.toml` under `[env.production]`.

## Development Tips

1. **Hot reload**: Both frontend and worker support hot reload during development
2. **Database changes**: Modify `schema.sql` and run `npm run db:migrate`
3. **Environment variables**: Use `.env.local` for local development secrets
4. **Logging**: Use `npm run worker:logs` to see worker logs in real-time

## Support

If you encounter issues:

1. Check the worker logs: `npm run worker:logs`
2. Verify database connectivity: `wrangler d1 execute housing-editor-local --local --command "SELECT 1;"`
3. Ensure all environment variables are set correctly
4. Restart both worker and frontend if needed
