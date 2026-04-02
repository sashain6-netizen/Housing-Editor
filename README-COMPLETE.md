# 🏠 Housing Editor - Hypixel HTSL Visual Blueprint Editor

[![Cloudflare Workers](https://img.shields.io/badge/Powered%20by-Cloudflare-F38020?logo=cloudflare&logoColor=white)](https://cloudflare.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A professional, Unreal Blueprint-inspired visual node editor for creating Hypixel Housing game logic using HTSL (Housing Template Scripts Language). Built with React, Cloudflare Workers, and D1 SQLite database.

## ✨ Features

### 🎨 Visual Node Editor
- **Purple Event Nodes**: Define game triggers (join, quit, block_break, etc.)
- **Blue Action Nodes**: Execute commands (send_message, give_item, teleport, set_stat, play_sound)
- **Orange Condition Nodes**: Decision branches (StatCheck, ItemCheck, TimeCheck)
- **Professional Dark Theme**: Unreal Blueprint-inspired UI
- **Drag & Drop**: Intuitive node composition with visual feedback
- **Auto-Layout**: Smart node organization and connection visualization

### 🔄 Two-Way Code Sync
- **Visual → Code**: Click nodes and see HTSL code generated in real-time
- **Code → Visual**: Paste or edit HTSL code and see nodes appear on canvas
- **Debounced Updates**: Optimized sync preventing race conditions
- **Live Highlighting**: See your code as you type with syntax highlighting

### 👤 User Accounts & Storage
- **Secure Authentication**: JWT tokens with rate limiting
- **Cloud Storage**: All projects saved to Cloudflare D1 database
- **Session Management**: KV-based session caching for performance
- **House Management**: Create, edit, delete, and organize projects
- **Auto-Save**: Every change is automatically saved to the cloud

### 🚀 Production Ready
- **Cloudflare Workers**: Serverless backend with global distribution
- **D1 Database**: SQLite on the edge, zero cold starts
- **KV Cache**: Session caching for instant authentication
- **Security**: Password hashing, JWT validation, rate limiting, CORS
- **Error Handling**: Comprehensive error messages and validation

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Cloudflare account (free tier works!)
- Git

### Step 1: Clone & Install

```bash
cd "c:\Projects\Housing Editor"
npm install
```

### Step 2: Create .env.local

```bash
# Copy the environment template
cp .env.example .env.local

# Update with your API URL
# REACT_APP_API_URL=http://localhost:8787
```

### Step 3: Start Frontend

```bash
npm run dev
```

Visit http://localhost:5173

### Step 4: Deploy Backend (Optional)

For full features (accounts, cloud save), set up Cloudflare backend:

```bash
# Follow CLOUDFLARE-DEPLOYMENT.md
wrangler init housing-editor-api
# ... complete setup steps
```

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK-START-CHECKLIST.md](./QUICK-START-CHECKLIST.md) | 5-minute quick start |
| [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) | Setup & testing guide |
| [CLOUDFLARE-DEPLOYMENT.md](./CLOUDFLARE-DEPLOYMENT.md) | Production deployment |
| [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) | Architecture overview |
| [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | File and API reference |

## 🎮 Usage

### Creating a Blueprint

1. **Add Event Node**: Right-click canvas → "Add Event" → Select trigger
2. **Add Actions**: Add action nodes below the event
3. **Connect**: Drag handles to create connections
4. **Conditions**: Add conditions for branching logic
5. **Review Code**: See generated HTSL on the right panel

### Example Blueprint

Visual Flow:
```
┌─────────────────┐
│  on_event join  │  (Purple)
└────────┬────────┘
         │
┌────────▼──────────┐
│ send_message      │  (Blue)
│ "Welcome!"        │
└────────┬──────────┘
         │
┌────────▼──────────┐
│ if player_has_item│  (Orange)
│ "apple" >= 1      │
├────────┬──────────┤
│ TRUE   │ FALSE    │
│        │          │
```

Generated Code:
```htsl
on_event "join" {
  send_message "Welcome!"
  if_player_has_item "apple" >= 1 {
    # True branch
  } else {
    # False branch
  }
}
```

## 🏗️ Architecture

### Frontend (React + React Flow)
```
┌─────────────────────────────────────────┐
│         React Application               │
├────────────────────┬────────────────────┤
│                    │                    │
│  Visual Editor     │   Code Editor      │
│  (React Flow)      │   (Syntax Highlight│
│                    │    + Live Sync)    │
└────────┬───────────┴────────┬───────────┘
         │                    │
         ├─◄──────────────────┤
         │   Two-Way Sync     │
         │   (Parser/Compiler)│
         ├──────────────────►─┤
```

### Backend (Cloudflare Workers)
```
┌─────────────────────────────────────────┐
│      Cloudflare Workers (Edge)          │
├─────────────────────────────────────────┤
│  /api/auth/register, login, me          │  JWT Auth
│  /api/auth/logout                       │
├─────────────────────────────────────────┤
│  /api/houses (GET, POST)                │  House CRUD
│  /api/houses/:id (GET, PUT, DELETE)     │
└────┬──────────────────────────────────┬─┘
     │                                  │
  ┌──▼──┐                            ┌──▼──┐
  │  D1 │  (SQLite Database)         │ KV  │  (Session Cache)
  │     │  Users, Houses, Sessions   │     │
  └─────┘                            └─────┘
```

## 🎨 Node Types

### Event Node (Purple) 🟣
Triggers that start execution:
- `join` - Player enters the house
- `quit` - Player leaves the house
- `block_break` - Player breaks a block
- `block_place` - Player places a block
- `kill` - Player kills another player
- `death` - Player dies
- `chat` - Player sends a message
- `interact` - Player interacts with block

### Action Node (Blue) 🔵
Commands that execute:
- `SendMessage` - Send chat message to player
- `GiveItem` - Give player items
- `Teleport` - Move player to coordinates
- `SetStat` - Change player statistic
- `PlaySound` - Play sound effect
- `Delay` - Wait before next action

### Condition Node (Orange) 🟠
Logic branches with True (green) and False (red) outputs:
- `StatCheck` - Compare player stat value
- `ItemCheck` - Check if player has item
- `TimeCheck` - Check current in-game time

## 🔐 Security

- **Password Hashing**: SHA-256 with salt (configurable to bcrypt)
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Configurable cross-origin requests
- **SQL Injection Prevention**: Parameterized queries
- **Session Validation**: Every request verified
- **Ownership Verification**: Users only access their own data

## 📊 Database Schema

### users
- `id` - UUID primary key
- `email` - Unique email address
- `password_hash` - Hashed password
- `name` - User's display name
- `created_at` - Account creation time

### houses
- `id` - UUID primary key
- `user_id` - Owner reference
- `name` - Project name
- `description` - Project description
- `code` - HTSL code content
- `created_at` - Creation time
- `updated_at` - Last modification time

### sessions
- `id` - UUID primary key
- `user_id` - User reference
- `token_hash` - JWT token hash
- `expires_at` - Token expiration time
- `created_at` - Session creation time

## 🛠️ Development

### Available Scripts

```bash
# Frontend
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # Build for production
npm run preview     # Preview production build

# Backend (if using Cloudflare)
npm run worker:dev  # Start worker development
npm run worker:build # Build worker
npm run worker:deploy # Deploy to Cloudflare
npm run worker:logs # View production logs
```

### File Structure

```
Housing Editor/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx        # Public landing page
│   │   ├── AuthPages.jsx          # Login/Register
│   │   ├── DashboardPage.jsx      # House list
│   │   └── EditorPage.jsx         # Main editor
│   ├── components/
│   │   ├── EventNode.jsx          # Event nodes
│   │   ├── ActionNode.jsx         # Action nodes
│   │   ├── ConditionNode.jsx      # Condition nodes
│   │   ├── CodeEditor.jsx         # Code panel
│   │   └── ProtectedRoute.jsx     # Auth guard
│   ├── store/
│   │   └── appStore.js            # Zustand state
│   ├── utils/
│   │   ├── htslCompiler.js        # Nodes → Code
│   │   └── htslParser.js          # Code → Nodes
│   ├── App.jsx                    # Router setup
│   └── index.css                  # Tailwind + custom styles
├── src/index.ts                   # Cloudflare backend
├── wrangler.toml                  # Worker config
├── schema.sql                     # Database schema
└── package.json                   # Dependencies
```

## 🎯 Next Steps

1. **Local Testing**: Run `npm run dev` and explore the UI
2. **Test Two-Way Sync**: Create nodes, edit code, watch sync
3. **Deploy Backend**: Follow [CLOUDFLARE-DEPLOYMENT.md](./CLOUDFLARE-DEPLOYMENT.md)
4. **Enable Accounts**: Restart frontend with backend URL
5. **Go Live**: Deploy frontend to Cloudflare Pages

## 📚 Learn More

### Project Documentation
- [Quick Start Checklist](./QUICK-START-CHECKLIST.md)
- [Developer Guide](./DEVELOPER-GUIDE.md)
- [Implementation Guide](./IMPLEMENTATION-GUIDE.md)
- [Quick Reference](./QUICK-REFERENCE.md)

### External Resources
- [React Flow Docs](https://reactflow.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/workers/platform/databases/)

## 🐛 Troubleshooting

### "Blank page on startup"
- Check browser console (F12) for errors
- Ensure `npm install` completed successfully
- Clear `node_modules/` and reinstall if needed

### "Two-way sync not working"
- Verify htslCompiler.js and htslParser.js are imported
- Check browser console for errors
- Ensure HTSL code format is valid
- Try refreshing the page

### "Backend not connecting"
- Check `.env.local` has correct `REACT_APP_API_URL`
- Verify backend is running (`wrangler dev`)
- Test API directly: `curl http://localhost:8787/api/health`
- Check CORS is enabled (should be by default)

### "Database errors"
- Run schema initialization: `wrangler d1 execute housing-editor --remote < schema.sql`
- Check Cloudflare dashboard for database status
- View logs: `wrangler tail --env production`

## 🤝 Contributing

This is a complete framework. Feel free to:
- Add more node types and actions
- Extend condition logic
- Customize the UI theme
- Improve the code parser/compiler
- Add collaborative editing
- Create templates library

## 📄 License

Built for Hypixel Housing community. Use freely.

## 🎉 Status

✅ **Frontend**: Complete and production-ready
✅ **Backend**: Complete and production-ready
✅ **Two-Way Sync**: Working and tested
✅ **Security**: Implemented with best practices
✅ **Documentation**: Comprehensive

Ready to deploy and use! 🚀

---

**Made for beautiful game logic editing** 🎮✨
