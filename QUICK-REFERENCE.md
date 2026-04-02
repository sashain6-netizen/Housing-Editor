# 🚀 Quick Reference - New Full-Stack Editor

## Files to Know

### Frontend Pages
| Page | Path | Purpose |
|------|------|---------|
| Landing | `/` | Welcome & sign up |
| Login | `/login` | User login |
| Register | `/register` | New account |
| Dashboard | `/dashboard` | Manage houses |
| Editor | `/editor/:id` | Edit + two-way sync |

### Key New Files
```
htslParser.js       ← Converts code to nodes (2-way sync magic!)
CodeEditor.jsx      ← Editable code with highlighting
EditorPage.jsx      ← Main editor combining both
appStore.js         ← API & auth state management
LandingPage.jsx     ← Beautiful welcome page
AuthPages.jsx       ← Login/register forms
DashboardPage.jsx   ← House management
```

---

## Setup Checklist

### Local Development
- [ ] `npm install` in project root
- [ ] Create `.env.local` with `REACT_APP_API_URL=http://localhost:8787`
- [ ] `npm run dev` (frontend at :5173)
- [ ] Set up backend separately (see BACKEND-SETUP.md)
- [ ] `wrangler dev` (backend at :8787)

### For Features to Work
- [ ] Backend API running
- [ ] D1 database created
- [ ] Routes implemented (see BACKEND-SETUP.md)
- [ ] REACT_APP_API_URL pointing to backend

---

## Two-Way Sync How-To

### Visual → Code
```
User adds/edits nodes
    ↓
generateHTSL() triggered
    ↓
Code display updates
    ↓
handleCodeChange() called
    ↓
Auto-save to database
```

### Code → Visual
```
User edits code
    ↓
parseHTSLToNodes() called  ⭐ This is the magic
    ↓
Visual graph updates
    ↓
Auto-save to database
```

**Key files:**
- `src/utils/htslCompiler.js` - Nodes → Code
- `src/utils/htslParser.js` - Code → Nodes

---

## API Integration

### Auth Store
```javascript
import { useAuthStore } from './store/appStore';

const { user, token, login, logout, register } = useAuthStore();
```

### Housing Store
```javascript
import { useHousingStore } from './store/appStore';

const { houses, currentHouse, createHouse, updateHouse, deleteHouse } = useHousingStore();
```

---

## Environment Variables

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:8787
```

### Backend (wrangler.toml)
```toml
[env.production]
database_id = "YOUR_D1_ID"
vars = { API_URL = "https://api.yourdomain.com" }
```

---

## Auto-Save Behavior

| Event | Trigger | Wait | Action |
|-------|---------|------|--------|
| User edits visual | onNodesChange | 2s | generateHTSL() |
| User edits code | handleCodeChange | 2s | parseHTSLToNodes() |
| Both | debounce | 2s | updateHouse() API call |

Status indicators:
- 💾 Saving... (while uploading)
- ✓ Saved (complete)
- Last saved: HH:MM:SS

---

## Database Schema Summary

```sql
users (id, email, password_hash, name, created_at)
houses (id, user_id, name, description, code, created_at, updated_at)
sessions (id, user_id, token, expires_at)
```

---

## API Endpoints Reference

| Method | URL | Purpose |
|--------|-----|---------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
| GET | /api/auth/me | Verify token |
| GET | /api/houses | List user's houses |
| POST | /api/houses | Create house |
| GET | /api/houses/:id | Get house |
| PUT | /api/houses/:id | Update house/code |
| DELETE | /api/houses/:id | Delete house |

All require: `Authorization: Bearer TOKEN`

---

## Common Tasks

### Add New Action Type

1. **htslCompiler.js** - Add case to `generateActionCode()`
2. **ActionNode.jsx** - Add input fields for new type
3. **ActionNode.jsx** - Add to actionTypes array

### Deploy to Production

```bash
# Frontend
npm run build
wrangler pages deploy dist

# Backend
wrangler publish --env production
```

### Test API Locally

```bash
# Register
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test"}'

# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Get houses
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8787/api/houses
```

---

## Debugging Tips

### Check Authentication
```javascript
const { user, token } = useAuthStore();
console.log('User:', user);
console.log('Token:', token);
```

### Check Current House
```javascript
const { currentHouse } = useHousingStore();
console.log('House:', currentHouse);
```

### Monitor API Calls
```bash
# Browser DevTools
F12 → Network tab
Filter: XHR/Fetch
Check requests/responses
```

### Check Sync Status
- Look for "📊 Visual" or "📝 Code" indicator
- Check "Saving..." status
- View last saved timestamp

---

## Files to Read First

1. **UPDATE-SUMMARY.md** - What changed
2. **IMPLEMENTATION-GUIDE.md** - Architecture & setup
3. **BACKEND-SETUP.md** - API implementation
4. **This file** - Quick reference

---

## Key Improvements Over v1

| Feature | Before | After |
|---------|--------|-------|
| UI | Single page | Multi-page with routing |
| Editing | Visual only | Visual + Code (2-way) |
| Storage | Browser only | Cloud (D1) |
| Users | N/A | Full auth system |
| Saving | Manual | Auto-save |
| Sharing | Copy-paste | Account-based |
| Import/Export | Manual paste | Code editor edit |
| Sync | N/A | Two-way |

---

## Next Action Items

1. [ ] Read UPDATE-SUMMARY.md
2. [ ] Run `npm install`
3. [ ] Create `.env.local`
4. [ ] Run `npm run dev` (test frontend)
5. [ ] Follow BACKEND-SETUP.md for backend
6. [ ] Test full flow locally
7. [ ] Deploy to production

---

## Useful Links

- React Flow: https://reactflow.dev/
- Zustand: https://github.com/pmndrs/zustand
- React Router: https://reactrouter.com/
- Cloudflare Docs: https://developers.cloudflare.com/workers/
- Tailwind CSS: https://tailwindcss.com/

---

**Questions? See the full docs in markdown files!** 📚
