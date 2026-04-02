# 🚀 Complete Implementation Guide - Full-Stack HTSL Editor

## Table of Contents
1. [Project Overview](#overview)
2. [Frontend Setup](#frontend-setup)
3. [Backend Setup](#backend-setup)
4. [Two-Way Code Sync](#two-way-sync)
5. [Deployment](#deployment)
6. [Features Explained](#features)

---

## 📋 Overview

This is a **full-stack web application** for creating and managing Hypixel Housing HTSL scripts:

### Architecture

```
┌─────────────────────────────────────┐
│      Frontend (React + Vite)        │
│ ├─ Landing Page                     │
│ ├─ Auth (Login/Register)            │
│ ├─ Dashboard (Manage Houses)        │
│ └─ Editor (Visual + Code Sync)      │
└─────────────────┬───────────────────┘
                  │ API Requests
                  ↓
┌─────────────────────────────────────┐
│  Backend (Cloudflare Workers)       │
│ ├─ Authentication (/api/auth/*)     │
│ └─ Houses CRUD (/api/houses/*)      │
└─────────────────┬───────────────────┘
                  │ Database Queries
                  ↓
┌─────────────────────────────────────┐
│  Data Layer (Cloudflare D1/KV)      │
│ ├─ Users Table                      │
│ ├─ Houses Table                     │
│ ├─ Sessions Table                   │
│ └─ KV Sessions Store                │
└─────────────────────────────────────┘
```

---

## 🎯 Frontend Setup

### Installation & Configuration

```bash
cd "c:\Projects\Housing Editor"

# Install dependencies
npm install

# Set up environment
echo 'REACT_APP_API_URL=http://localhost:8787' > .env.local
```

### Project Structure

```
src/
├── pages/
│   ├── LandingPage.jsx          # Welcome page
│   ├── AuthPages.jsx             # Login & Register forms
│   ├── DashboardPage.jsx         # House management
│   └── EditorPage.jsx            # Main editor with sync
├── components/
│   ├── EventNode.jsx             # Visual event node
│   ├── ActionNode.jsx            # Visual action node
│   ├── ConditionNode.jsx         # Visual condition node
│   ├── CodeEditor.jsx            # Code editor with syntax highlighting
│   └── ProtectedRoute.jsx        # Auth guard
├── store/
│   └── appStore.js               # Zustand state management
├── utils/
│   ├── htslCompiler.js           # Nodes → HTSL code
│   ├── htslParser.js             # HTSL code → Nodes (2-way sync)
│   └── examples.js               # Example workflows
├── App.jsx                       # Main app with routing
└── index.css                     # Global styles
```

### Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | View & manage houses |
| `/editor/:houseId` | Edit house |

### Development Server

```bash
npm run dev
# Opens http://localhost:5173
```

---

## 🔧 Backend Setup

### Quick Start

```bash
# Install Wrangler globally
npm install -g wrangler

# Initialize project
wrangler init housing-editor-api

# Create D1 database
wrangler d1 create housing-editor

# Set up database
wrangler d1 execute housing-editor --remote < BACKEND-SETUP.md
```

### API Endpoints

#### Authentication

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Verify token |

#### Houses

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/houses` | List user's houses |
| POST | `/api/houses` | Create house |
| GET | `/api/houses/:id` | Get house details |
| PUT | `/api/houses/:id` | Update house/code |
| DELETE | `/api/houses/:id` | Delete house |

### Environment Variables

Create `.env` in worker project:

```
JWT_SECRET=your-secure-secret-here
DATABASE_ID=YOUR_D1_DATABASE_ID
KV_NAMESPACE_ID=YOUR_KV_NAMESPACE_ID
```

### Local Testing

```bash
# Start local API server
wrangler dev

# Test endpoint
curl http://localhost:8787/api/auth/me
```

---

## 🔄 Two-Way Code Sync

This is the **core feature** that makes the editor powerful:

### How It Works

1. **Visual → Code** (automatically)
   ```
   User edits nodes
   ↓
   onNodesChange / onEdgesChange trigger
   ↓
   generateHTSL() converts nodes to code
   ↓
   Code display updates
   ↓
   Auto-saves to database
   ```

2. **Code → Visual** (automatically)
   ```
   User edits code
   ↓
   handleCodeChange triggers
   ↓
   parseHTSLToNodes() converts code to nodes
   ↓
   Visual editor updates
   ↓
   Auto-saves to database
   ```

### The Parser (Code → Nodes)

In `src/utils/htslParser.js`:

```javascript
// Convert HTSL code to visual nodes
const { nodes, edges } = parseHTSLToNodes(htslCode);

// Example:
const code = `on_event "PlayerJoin" {
  send_message "Welcome!"
  if (stat "coins" >= 100) {
    give_item "Diamond" 5
  }
}`;

const { nodes, edges } = parseHTSLToNodes(code);
// nodes = [
//   { id: 'event_0', type: 'event', ... },
//   { id: 'action_1', type: 'action', data: { actionType: 'SendMessage', ... } },
//   { id: 'condition_2', type: 'condition', ... },
//   { id: 'action_3', type: 'action', data: { actionType: 'GiveItem', ... } }
// ]
// edges = [connection mappings]
```

### The Compiler (Nodes → Code)

In `src/utils/htslCompiler.js`:

```javascript
// Convert visual nodes to HTSL code
const htslCode = generateHTSL(nodes, edges);

// Traverses from Event nodes and generates formatted code
```

### Debouncing

To prevent infinite loops and excessive API calls:

```javascript
// Code changes are debounced (500ms)
const debouncedOnChange = useCallback(
  debounce((newCode) => {
    onCodeChange(newCode); // Parse & save
  }, 500),
  [onCodeChange]
);
```

### Sync Status Indicator

The editor shows sync status:
- 💾 **Saving...** - API request in progress
- ✓ **Saved** - Code synced to database
- 📊 **Visual** - Last change was from visual editor
- 📝 **Code** - Last change was from code editor

---

## 🌐 Deployment

### Frontend (Cloudflare Pages)

```bash
# Build
npm run build

# Deploy
wrangler pages deploy dist
```

### Backend (Cloudflare Workers)

```bash
# From backend project directory
wrangler publish --env production
```

### Environment Setup (Production)

In `wrangler.toml`:

```toml
[env.production]
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
vars = { API_URL = "https://api.yourdomain.com" }
```

In React `.env`:

```
REACT_APP_API_URL=https://api.yourdomain.com
```

---

## ✨ Features Explained

### 1. Landing Page

- Explains editor features
- Node types overview
- Call-to-action for registration
- Professional design

### 2. Authentication

**Registration:**
- Email validation
- Password strength (min 6 chars)
- Account creation
- Auto-login after registration

**Login:**
- Email & password verification
- Token-based sessions (7-day expiry)
- Secure storage (localStorage)
- Auto-redirect to dashboard

### 3. Dashboard

**House Management:**
- List all user's houses
- Create new house
- Delete houses
- Edit (go to editor)
- Last updated timestamp
- Descriptions

**Create Modal:**
- Name (required)
- Description (optional)
- Auto-opens when clicking "New House"

### 4. Editor with Two-Way Sync

**Split Screen:**
- Left: Visual node canvas (60%)
- Right: Code editor (40%)

**Features:**
- Drag-and-drop nodes
- Connect with edges
- Edit fields in-place
- Live code generation
- Real-time parsing
- Auto-save (2-second debounce)

**Node Operations:**
- Add: Click "+ Event/Action/Condition"
- Delete: Select + click "🗑️ Delete"
- Clear All: Clear entire graph
- Stats: Show node/edge count

**Code Editor:**
- Syntax highlighting (Prism.js)
- Line numbers
- Copy to clipboard
- Download as .htsl file
- Character/line count
- Editable (two-way sync)

### 5. Auto-Save

- Triggers after 2 seconds of inactivity
- Shows "💾 Saving..." status
- Updates "Last saved" timestamp
- No manual save button needed
- Changes sync to database automatically

---

## 🔐 Security Considerations

### Current Implementation
- Token stored in localStorage
- Bearer token in Authorization header
- Session expiry (7 days)
- User ownership verification on all operations

### Production Improvements
1. **Use bcrypt for passwords** instead of SHA-256
2. **Implement CSRF protection**
3. **Add rate limiting** on auth endpoints
4. **Enable CORS** for your domain only
5. **Use httpOnly cookies** for tokens (if possible with Cloudflare)
6. **Add password reset** flow
7. **Implement 2FA** (optional)

---

## 🚀 Usage Walkthrough

### For End Users

1. **Sign Up**
   - Go to landing page
   - Click "Get Started"
   - Enter email, password, name
   - Auto-redirected to dashboard

2. **Create House**
   - Click "New House"
   - Enter name & optional description
   - Click "Create"
   - Auto-opens editor

3. **Build Script**
   - Click "+ Event" to start
   - Add actions/conditions
   - Watch code update live
   - Edit code, see visual update
   - Auto-saves every 2 seconds

4. **Export**
   - Copy code from editor
   - Download as .htsl file
   - Use in Hypixel

5. **Come Back Later**
   - Sign in again
   - All houses preserved
   - Code auto-loaded

---

## 📊 Example Workflow

### Create a Reward System

1. **Add Event Node** (PlayerJoin)
2. **Add Action Node** (SendMessage: "Welcome!")
3. **Connect Event → Action**
4. **Add Condition Node** (coins >= 100)
5. **Connect Action → Condition**
6. **Add Action Node** (GiveItem: Diamond, 5) - TRUE path
7. **Add Action Node** (SendMessage: "Get more coins") - FALSE path
8. **Connect Condition → both actions**

**Generated Code:**
```
on_event "PlayerJoin" {
  send_message "Welcome!"
  if (stat "coins" >= 100) {
    give_item "Diamond" 5
  }
  else {
    send_message "Get more coins"
  }
}
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "API not found" | Check API_URL in .env, ensure backend is running |
| "Unauthorized" | Token expired, try logging in again |
| Parser error | Ensure code is valid HTSL format |
| Sync lag | Normal debouncing delay (500ms) |
| Code not saving | Check network tab, verify auth token |

---

## 📚 Additional Resources

- **React Flow:** https://reactflow.dev/
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Cloudflare D1:** https://developers.cloudflare.com/d1/
- **Zustand Docs:** https://github.com/pmndrs/zustand
- **Tailwind CSS:** https://tailwindcss.com/

---

## 🎓 Next Steps

1. **Test locally:**
   ```bash
   npm run dev
   ```

2. **Set up backend:**
   - Follow BACKEND-SETUP.md
   - Create D1 database
   - Deploy worker

3. **Connect frontend to backend:**
   - Update `REACT_APP_API_URL`
   - Test API calls

4. **Deploy to production:**
   - Build frontend
   - Deploy to Cloudflare Pages
   - Deploy backend worker

5. **Iterate:**
   - Add more action types
   - Improve parser
   - Add more features

---

**Happy Housing! 🏠✨**
