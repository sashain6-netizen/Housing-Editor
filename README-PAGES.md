# Cloudflare Pages Deployment

This guide covers deploying the Housing Editor to Cloudflare Pages with D1 database and KV storage.

## Architecture Overview

- **Frontend**: React + Vite deployed to Cloudflare Pages
- **Backend**: Pages Functions with direct D1 and KV bindings
- **Database**: D1 SQLite database `housing-editor`
- **Storage**: KV namespace for session management
- **Domain**: `housing-editor.pages.dev`

## Quick Setup

Run the automated setup script:

```bash
node setup-pages.js
```

This will:
- Initialize the D1 database schema
- Verify KV namespace access
- Create production environment files
- Test database connectivity

## Manual Setup

### 1. Initialize Database

```bash
wrangler d1 execute housing-editor --file=schema.sql
```

### 2. Verify Configuration

Ensure `wrangler.toml` has the correct bindings:

```toml
[[d1_databases]]
binding = "DB"
database_name = "housing-editor"
database_id = "16d40a18-e293-4ebc-81e7-380c736f55f0"

[[kv_namespaces]]
binding = "KV"
id = "c675420dfbbe46e7937fa8043c5d9ef6"
```

### 3. Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://housing-editor.pages.dev/api
```

## Deployment Commands

### Deploy to Production

```bash
npm run pages:deploy
```

This builds the frontend and deploys everything to Pages.

### Local Development

```bash
npm run pages:dev
```

Runs the full Pages application locally with D1 and KV.

### Database Operations

```bash
npm run db:init      # Initialize database schema
npm run db:migrate   # Re-run migrations
npm run db:backup    # Export database
```

### Monitoring

```bash
npm run logs         # View deployment logs
```

## File Structure

```
├── functions/
│   └── api/
│       └── [[path]].js    # Pages Functions API
├── dist/                  # Built frontend
├── schema.sql             # Database schema
├── wrangler.toml          # Pages configuration
└── src/
    ├── store/
    │   └── appStore.js    # Frontend API client
    └── ...                # React components
```

## API Endpoints

All endpoints are available at `https://housing-editor.pages.dev/api`:

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

## Database Schema

The D1 database includes:

- **users** - User accounts and authentication
- **sessions** - JWT session management
- **houses** - HTSL project storage
- **activity_log** - User activity tracking

## Direct Bindings

The backend uses direct D1 and KV bindings:

```javascript
// In functions/api/[[path]].js
export async function onRequest(request, env, ctx) {
  // Direct access to database
  const users = await env.DB.prepare('SELECT * FROM users').all();
  
  // Direct access to KV
  await env.KV.put('key', 'value');
}
```

## Environment Configuration

### Production (wrangler.toml)

```toml
[vars]
VITE_API_URL = "https://housing-editor.pages.dev/api"
JWT_SECRET = "your-production-secret"

[[d1_databases]]
binding = "DB"
database_name = "housing-editor"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "KV"
id = "your-kv-id"
```

### Development

For local development, the API URL automatically falls back to:
`https://housing-editor.pages.dev/api`

## Security Considerations

1. **JWT Secret**: Use a strong, unique JWT secret in production
2. **CORS**: API allows all origins - restrict in production if needed
3. **Rate Limiting**: Currently disabled - implement for production
4. **Password Hashing**: Uses SHA-256 with salt - consider bcrypt

## Monitoring and Debugging

### View Logs

```bash
npm run logs
```

### Database Queries

```bash
# Interactive SQL
wrangler d1 execute housing-editor --command "SELECT * FROM users LIMIT 10;"

# Run SQL file
wrangler d1 execute housing-editor --file=queries.sql
```

### KV Operations

```bash
# List KV keys
wrangler kv:key list --namespace-id=your-kv-id

# Get KV value
wrangler kv:key get --namespace-id=your-kv-id some-key
```

## Performance Optimization

1. **Database Indexes**: Schema includes proper indexes
2. **KV Caching**: Sessions cached in KV for faster lookups
3. **CDN**: Pages automatically caches static assets
4. **Edge Computing**: Functions run globally distributed

## Rollback

If deployment fails:

```bash
# View deployment history
wrangler pages deployment list

# Rollback to previous deployment
wrangler pages deployment rollback [deployment-id]
```

## Migration from Workers

If migrating from Workers:

1. Move worker logic to `functions/api/[[path]].js`
2. Update `wrangler.toml` for Pages configuration
3. Update frontend API URL
4. Deploy with `npm run pages:deploy`

## Troubleshooting

### Common Issues

1. **Database connection**: Verify D1 bindings in `wrangler.toml`
2. **KV access**: Ensure KV namespace is correctly bound
3. **Build errors**: Check `npm run build` locally first
4. **API 404s**: Verify Functions are in correct directory

### Debug Mode

Add debugging to Functions:

```javascript
export async function onRequest(request, env, ctx) {
  console.log('Request:', request.method, request.url);
  console.log('Environment:', Object.keys(env));
  
  // Your handler logic
}
```

## Support

For issues:

1. Check deployment logs: `npm run logs`
2. Verify configuration in `wrangler.toml`
3. Test locally: `npm run pages:dev`
4. Check Cloudflare Dashboard for D1/KV status
