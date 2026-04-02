# Cloudflare Deployment Guide

Complete setup guide for deploying Housing Editor backend to Cloudflare Workers with D1 database and KV storage.

## 🚀 Quick Start

### Step 1: Create Cloudflare Workers Project

```bash
# Create new Workers project
wrangler init housing-editor-api

# Navigate to project
cd housing-editor-api
```

### Step 2: Create D1 Database

```bash
# Create database
wrangler d1 create housing-editor

# Note: Save the database_id from the output
```

### Step 3: Create KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create housing-editor-kv

# Note: Save the namespace_id from the output
```

### Step 4: Update wrangler.toml

Replace the `wrangler.toml` with the configuration from the project (already prepared).

Update these values:
- `database_id` - from Step 2
- `id` under `[kv_namespaces]` - from Step 3

Example:
```toml
[[d1_databases]]
binding = "DB"
database_name = "housing-editor"
database_id = "12345678-1234-1234-1234-123456789012"

[[kv_namespaces]]
binding = "KV"
id = "abcdef1234567890"
```

### Step 5: Copy Backend Code

Copy the `src/index.ts` file to your Workers project:

```bash
# Copy the complete backend implementation
cp src/index.ts path/to/workers-project/src/index.ts
```

### Step 6: Initialize Database Schema

```bash
# Execute schema in D1
wrangler d1 execute housing-editor --remote < schema.sql
```

### Step 7: Set Environment Variables

In Cloudflare Dashboard → Workers → Settings → Environment Variables:

```
JWT_SECRET=your-very-secure-random-string-here
ENVIRONMENT=production
```

Generate a secure JWT_SECRET:
```bash
# Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 8: Test Locally

```bash
# Start local development
wrangler dev

# API available at http://localhost:8787
```

## 🧪 Testing the API

### Register User
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "name": "John Doe"
  }'
```

Response:
```json
{
  "success": true,
  "user": { "id": "...", "email": "user@example.com", "name": "John Doe" },
  "token": "eyJhbGc...",
  "expiresIn": 604800
}
```

### Login
```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8787/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create House
```bash
curl -X POST http://localhost:8787/api/houses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Awesome House",
    "description": "A cool place",
    "code": ""
  }'
```

### List Houses
```bash
curl -X GET http://localhost:8787/api/houses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update House
```bash
curl -X PUT http://localhost:8787/api/houses/HOUSE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "on_event \"join\" { send_message \"Welcome!\" }"
  }'
```

### Delete House
```bash
curl -X DELETE http://localhost:8787/api/houses/HOUSE_ID \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🌐 Deploy to Cloudflare

### Production Deployment

```bash
# Login to Cloudflare
wrangler login

# Deploy to production
wrangler deploy --env production

# View logs
wrangler tail --env production
```

After deployment, note your worker URL (e.g., `https://housing-editor-api.yourname.workers.dev`)

## 🔗 Configure Frontend

Update the frontend to use your deployed API:

1. Create `.env.local` in the frontend directory
2. Add your API URL:

```env
REACT_APP_API_URL=https://housing-editor-api.yourname.workers.dev
```

3. Restart the frontend dev server:
```bash
npm run dev
```

## 📊 Database Schema

The schema includes 5 tables:

1. **users** - User accounts with hashed passwords
2. **houses** - User's housing projects
3. **sessions** - JWT token tracking
4. **house_collaborators** - Future: multi-user editing
5. **activity_log** - Audit trail

All tables have proper indexes for performance.

## 🔐 Security Features

✅ **Password Hashing**: SHA-256 with salt (upgrade to bcrypt for production)
✅ **JWT Authentication**: Token-based with expiration
✅ **Rate Limiting**: KV-based rate limiting on auth endpoints
✅ **CORS**: Configured for browser-based requests
✅ **SQL Injection Prevention**: Parameterized queries
✅ **Token Hash Storage**: Tokens hashed before DB storage
✅ **Session Validation**: Token checked on every request
✅ **Ownership Verification**: Users can only access their own houses

## 🚨 Common Issues

### "Database not found"
- Make sure `database_id` in `wrangler.toml` is correct
- Run schema initialization: `wrangler d1 execute housing-editor --remote < schema.sql`

### "KV namespace not found"
- Check `id` under `[[kv_namespaces]]` in `wrangler.toml`
- Create namespace if missing: `wrangler kv:namespace create housing-editor-kv`

### "Invalid JWT_SECRET"
- Make sure `JWT_SECRET` is set in Cloudflare Dashboard
- Use a long, random string (32+ characters)

### "CORS errors in frontend"
- Check Access-Control-Allow-Origin header is being sent
- Verify frontend URL is allowed (currently allows all with `*`)
- For production, restrict to your domain

### "Token expired"
- Tokens expire after 7 days (registration) or 30 days (login)
- Users need to login again after expiration
- Adjust TOKEN_AGE in environment variables if needed

## 📈 Monitoring

### View Real-time Logs
```bash
wrangler tail --env production
```

### Check Database Size
```bash
wrangler d1 execute housing-editor --remote "SELECT COUNT(*) FROM users, COUNT(*) FROM houses;"
```

### Monitor API Performance
Cloudflare automatically tracks:
- Request count
- Response times
- Error rates
- KV operations

View in Cloudflare Dashboard → Workers → Analytics

## 💾 Backups

### Export Database
```bash
wrangler d1 export housing-editor --remote > backup.sql
```

### Restore Database
```bash
wrangler d1 execute housing-editor --remote < backup.sql
```

## 🔄 Updates

To update the backend code:

```bash
# Update your index.ts file
# Then:
wrangler deploy --env production
```

No downtime - Cloudflare handles rolling updates.

## 📝 Next Steps

1. **Deploy Backend**: Follow the Quick Start above
2. **Configure Frontend**: Update API URL in `.env.local`
3. **Test API**: Run test curl commands above
4. **Set Custom Domain**: (Optional) Configure in Cloudflare Dashboard
5. **Enable Auto-save**: Check that EditorPage saves on every change

## 🎯 Production Checklist

- [ ] JWT_SECRET is set and secure
- [ ] Database schema initialized
- [ ] KV namespace created
- [ ] CORS properly configured for your domain
- [ ] Rate limiting enabled on auth endpoints
- [ ] Password hashing upgraded to bcrypt
- [ ] Database backups scheduled
- [ ] Error monitoring set up
- [ ] Frontend API URL configured
- [ ] SSL certificate issued (automatic with Cloudflare)

## 📞 Support

For issues with:
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **D1 Database**: https://developers.cloudflare.com/workers/platform/databases/
- **KV Storage**: https://developers.cloudflare.com/workers/runtime-apis/kv/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

---

**Deployment Status**: Ready for Production ✅
