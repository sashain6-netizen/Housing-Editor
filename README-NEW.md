# 🏠 Hypixel Housing HTSL Editor - Full-Stack

A **professional full-stack web application** for creating and managing Hypixel Housing HTSL (Housing Text Scripting Language) scripts with visual editing, code editing, and two-way sync.

## ✨ Key Features

### 🎨 Visual Node Editor
- Drag-and-drop node-based interface (React Flow)
- Color-coded node types (Event, Action, Condition)
- Real-time graph visualization
- Connection management

### 📝 Code Editor
- Syntax-highlighted HTSL code
- Editable code with live preview
- Copy to clipboard & download
- Line/character count

### 🔄 **Two-Way Sync** (NEW!)
- **Edit visually** → Code updates automatically
- **Edit code** → Visual graph updates automatically
- No manual sync needed
- Debounced to prevent loops

### 👤 **Account System** (NEW!)
- User registration & login
- Secure token-based authentication
- Account-based house management
- 7-day session expiry

### ☁️ **Cloud Storage** (NEW!)
- All houses saved to Cloudflare D1 database
- Auto-save as you work (2-second debounce)
- Never lose your work
- Edit from anywhere

### 🚀 **Full-Stack Architecture**
- **Frontend**: React 18 + React Router + React Flow + Tailwind
- **Backend**: Cloudflare Workers API
- **Database**: Cloudflare D1 (SQL)
- **Sessions**: Cloudflare KV
- **Deployment**: Cloudflare (Pages + Workers)

---

## 🚀 Quick Start (5 Minutes)

### Frontend

```bash
cd "c:\Projects\Housing Editor"
npm install
npm run dev
```

Opens at `http://localhost:5173`

### Backend

See **BACKEND-SETUP.md** for complete instructions:

```bash
wrangler init housing-editor-api
wrangler d1 create housing-editor
wrangler dev
```

API at `http://localhost:8787`

### Connect

Create `.env.local`:
```
REACT_APP_API_URL=http://localhost:8787
```

---

## 📋 Tech Stack

### Frontend
- React 18, React Router, React Flow
- Zustand, Axios, Tailwind CSS
- Vite, React Syntax Highlighter

### Backend
- Cloudflare Workers
- Cloudflare D1 (SQL)
- Cloudflare KV
- Wrangler CLI

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── LandingPage.jsx          # Welcome & features
│   ├── AuthPages.jsx            # Login & Register
│   ├── DashboardPage.jsx        # Manage houses
│   └── EditorPage.jsx           # Main editor + sync
├── components/
│   ├── EventNode.jsx            # Event nodes
│   ├── ActionNode.jsx           # Action nodes
│   ├── ConditionNode.jsx        # Condition nodes
│   ├── CodeEditor.jsx           # Code editor
│   └── ProtectedRoute.jsx       # Auth guard
├── store/
│   └── appStore.js              # Zustand state
├── utils/
│   ├── htslCompiler.js          # Nodes → HTSL
│   ├── htslParser.js            # HTSL → Nodes ⭐
│   └── examples.js              # Examples
└── App.jsx                      # Routing
```

### Documentation

| Document | Purpose |
|----------|---------|
| **IMPLEMENTATION-GUIDE.md** | Complete setup & architecture |
| **BACKEND-SETUP.md** | Full API & database guide |
| **QUICKSTART.md** | 5-minute intro |
| **PROJECT-OVERVIEW.md** | Features overview |

---

## 🎮 How to Use

### 1. Register & Login
- Landing page with sign-up/login
- Email validation
- Auto-login after registration

### 2. Create House
- Click "New House"
- Enter name & description
- Auto-opens editor

### 3. Edit Script
**Visual:**
- Add Event/Action/Condition nodes
- Drag to arrange
- Connect with edges
- Watch code generate

**Code:**
- Edit HTSL directly
- Watch visual update
- Syntax highlighting
- Auto-parses

### 4. Export
- Copy code to clipboard
- Download as `.htsl` file

---

## 🔄 Two-Way Sync (The Game Changer)

### Visual → Code
User adds/edits nodes → `generateHTSL()` → Code displayed → Auto-saved

### Code → Visual
User edits code → `parseHTSLToNodes()` → Visual updates → Auto-saved

**Key file:** `src/utils/htslParser.js` converts HTSL code back to nodes

---

## 📊 Node Types

| Type | Color | Purpose | Examples |
|------|-------|---------|----------|
| **Event** | Blue | Entry point | PlayerJoin, PlayerKill, etc. |
| **Action** | Green | Commands (8 types) | SendMessage, GiveItem, Teleport, SetStat, PlaySound, Delay, ClearInventory, Kill |
| **Condition** | Purple | Decisions (3 types) | StatCheck, ItemCheck, TimeCheck |

---

## 💾 Auto-Save

- Triggers after 2 seconds of inactivity
- Shows "💾 Saving..." indicator
- Updates "Last saved" timestamp
- Saves to Cloudflare D1
- No manual save needed

---

## 🔐 Authentication

### Register
```
POST /api/auth/register
{ email, password, name }
→ { user, token }
```

### Login
```
POST /api/auth/login
{ email, password }
→ { user, token }
```

### Verify
```
GET /api/auth/me
Header: Authorization: Bearer TOKEN
→ { user }
```

---

## 🌐 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Verify token |
| GET | `/api/houses` | List houses |
| POST | `/api/houses` | Create house |
| GET | `/api/houses/:id` | Get house |
| PUT | `/api/houses/:id` | Update (including code) |
| DELETE | `/api/houses/:id` | Delete house |

---

## 📈 Example: Reward System

### Visual Steps
1. Event: "PlayerJoin"
2. Action: SendMessage "Welcome!"
3. Condition: coins >= 100
4. TRUE → GiveItem "Diamond" 5
5. FALSE → SendMessage "Get coins"

### Generated HTSL
```
on_event "PlayerJoin" {
  send_message "Welcome!"
  if (stat "coins" >= 100) {
    give_item "Diamond" 5
  }
  else {
    send_message "Get coins"
  }
}
```

---

## 🚀 Deployment

### Frontend
```bash
npm run build
wrangler pages deploy dist
```

### Backend
```bash
wrangler publish --env production
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "API not found" | Check REACT_APP_API_URL in .env.local |
| "Unauthorized" | Token expired, log in again |
| Parser error | Ensure HTSL is valid format |
| Code not updating | Try refreshing page |

---

## 📚 Documentation Links

- **IMPLEMENTATION-GUIDE.md** - Architecture & detailed setup
- **BACKEND-SETUP.md** - Cloudflare Workers & D1 setup
- **QUICKSTART.md** - Quick 5-minute guide
- **PROJECT-OVERVIEW.md** - Feature showcase

---

## ✅ Checklist

- ✅ Landing page with auth
- ✅ User registration & login
- ✅ Dashboard (manage houses)
- ✅ Visual editor (drag-drop nodes)
- ✅ Code editor (syntax highlighting)
- ✅ **Two-way sync** (visual ↔ code)
- ✅ Auto-save to database
- ✅ Cloud storage (D1)
- ✅ Session management
- ✅ Protected routes
- ✅ Professional UI
- ✅ Copy/download

---

## 📞 Next Steps

1. **Development:**
   ```bash
   npm run dev
   wrangler dev
   ```

2. **Setup Backend:**
   - Follow BACKEND-SETUP.md
   - Create D1 database
   - Deploy worker

3. **Deploy:**
   - Build frontend
   - Deploy to Cloudflare Pages
   - Deploy backend worker

4. **Use:**
   - Create account
   - Build scripts
   - Export HTSL

---

**Built for Hypixel Housing Developers 🏠✨**

See IMPLEMENTATION-GUIDE.md for complete documentation.
