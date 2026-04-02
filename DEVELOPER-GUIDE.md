# Getting Started - Developer Guide

## Quick Start (5 minutes)

### Prerequisites
- Node.js 16+ and npm
- Git
- A text editor or IDE

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy the environment template and update with your API URL:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
REACT_APP_API_URL=http://localhost:8787
```

### 3. Start the Development Server
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Local Testing Without Backend

You can test the **entire UI** and functionality locally without implementing the backend:

### What Works Locally:
- ✅ Landing page navigation
- ✅ Login/Register forms (form submission will fail without backend, but UI works)
- ✅ Visual node editor (create/edit nodes)
- ✅ HTSL code generation (nodes → code)
- ✅ Code parsing to visual (code → nodes) 
- ✅ Two-way sync (edit one, see the other update)
- ✅ All the drag-and-drop node editing
- ✅ Code syntax highlighting and download

### What Requires Backend:
- ❌ Saving data to database
- ❌ Loading saved houses
- ❌ User authentication/login
- ❌ Auto-save functionality (no server to save to)

---

## Testing the Two-Way Sync Feature Locally

This is the core feature. Test it with these steps:

### Test 1: Visual → Code Sync
1. Open the editor page (any page with the node canvas)
2. Right-click on the canvas → "Add Event" 
3. A new event node appears
4. **Watch the Code panel on the right** - it automatically updates with new HTSL code
5. Try adding Actions and Conditions
6. Watch the code compile in real-time

### Test 2: Code → Visual Sync
1. In the Code panel on the right, paste or edit HTSL code
2. Example: Paste this:
```htsl
on_event "join" {
  send_message "Welcome!"
}
```
3. **Watch the Visual panel on the left** - nodes appear based on your code
4. Edit the message text in the code
5. The visual node updates to reflect the change

### Test 3: Round-Trip (Visual → Code → Visual)
1. Create a complex node structure visually
2. Copy the generated code
3. Delete all nodes (Clear button)
4. Paste the code into the editor
5. Nodes rebuild from the code
6. Verify they match your original structure

---

## Project Structure Overview

```
Housing Editor/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx          ← Marketing landing page
│   │   ├── AuthPages.jsx            ← Login/Register forms
│   │   ├── DashboardPage.jsx        ← House list & management
│   │   └── EditorPage.jsx           ← Split-screen visual + code editor
│   ├── components/
│   │   ├── EventNode.jsx            ← Visual node component (event type)
│   │   ├── ActionNode.jsx           ← Visual node component (action type)
│   │   ├── ConditionNode.jsx        ← Visual node component (condition type)
│   │   ├── CodeEditor.jsx           ← Syntax-highlighted code editor
│   │   ├── ProtectedRoute.jsx       ← Auth guard for routes
│   │   └── [other nodes]
│   ├── store/
│   │   └── appStore.js              ← Zustand state (auth + housing)
│   ├── utils/
│   │   ├── htslCompiler.js          ← Visual → HTSL code generator
│   │   ├── htslParser.js            ← HTSL code → Visual parser
│   │   └── colors.js                ← Node color definitions
│   ├── App.jsx                      ← Router & main app
│   └── index.css                    ← Global Tailwind styles
├── public/
│   └── index.html
├── package.json                     ← Dependencies
├── vite.config.js                   ← Vite bundler config
├── .env.local                       ← Your environment variables (not in git)
└── .env.example                     ← Template for .env.local
```

---

## Available npm Scripts

```bash
# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Check for errors (if installed)
npm run lint
```

---

## Understanding the Two-Way Sync Architecture

### The Flow Diagram:

```
┌─────────────────────────────────────────────────────────┐
│         User Makes Change in Visual Editor              │
│              (Create/Edit/Delete Node)                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        Nodes & Edges Update (React state)
                   │
                   ◄─ Triggers useEffect
                   │
                   ▼
    generateHTSL(nodes, edges) ─► HTSL code string
                   │
                   ▼
         Display code in Code Editor
                   │
                   ◄─ Debounce 2 seconds
                   │
                   ▼
         Save to Database (when backend ready)


┌─────────────────────────────────────────────────────────┐
│         User Types in Code Editor                        │
│              (Edits HTSL code)                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        Code Updates (React state)
                   │
                   ◄─ Triggers handleCodeChange
                   │
                   ▼
    parseHTSLToNodes(code) ─► Parse & generate nodes/edges
                   │
                   ▼
         Update Visual Canvas with New Nodes
                   │
                   ▼
    generateHTSL again to sync display
```

### Key Files:
- **htslCompiler.js**: Converts visual → code (generateHTSL function)
- **htslParser.js**: Converts code → visual (parseHTSLToNodes function)
- **EditorPage.jsx**: Orchestrates the two-way sync with debouncing

---

## Connecting to the Backend

When you're ready to enable full features (auth, saving, etc.):

1. **Implement Cloudflare Backend**
   - Follow [BACKEND-SETUP.md](./BACKEND-SETUP.md)
   - Create D1 database with schema
   - Implement API endpoints
   - Deploy worker to Cloudflare

2. **Configure Frontend**
   - Update `.env.local`:
   ```env
   REACT_APP_API_URL=https://your-worker-domain.com
   ```
   - Restart dev server

3. **Test Full Auth Flow**
   - Register new account
   - Login
   - Create a house
   - Open editor and make edits
   - Refresh page - changes should persist
   - Auto-save should happen every change (debounced)

---

## Common Tasks

### Add a New Action Type

**File:** `src/components/ActionNode.jsx`

Example (already there): SendMessage, GiveItem, Teleport

To add a new action:
1. Add it to the `actionTypes` array in ActionNode.jsx
2. Add handling in `htslCompiler.js` generateActionHTSL() function
3. Add parsing in `htslParser.js` parseEventBody() function

### Debug the Two-Way Sync

**Enable logging in EditorPage.jsx:**

```javascript
useEffect(() => {
  const code = generateHTSL(nodes, edges);
  console.log('Generated HTSL:', code);  // ← Add this
  setHTSLCode(code);
  debouncedSave(code);
}, [nodes, edges]);
```

Check the browser console (F12) to see the generated code and debug what's being created.

### Test Specific HTSL Code

Paste test code in the Code panel:

```htsl
on_event "join" {
  send_message "Hello, {player_name}!"
  if_player_has_item "apple" {
    give_item "golden_apple"
  }
}

on_event "block_break" {
  add_stat "blocks_broken" 1
  set_stat "level" 10
}
```

Watch the visual nodes appear in the canvas.

---

## Troubleshooting

### "Blank page when I start the server"
- Check console for errors (F12)
- Ensure all dependencies are installed: `npm install`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### "Two-way sync not working"
- Check that both `htslCompiler.js` and `htslParser.js` are imported
- Check browser console for errors
- Verify HTSL code format is correct (see examples)
- Look at existing test patterns in the code

### "Backend not working"
- Ensure Cloudflare Worker is deployed correctly
- Check CORS settings (allow your frontend origin)
- Verify D1 database schema matches what code expects
- See [BACKEND-SETUP.md](./BACKEND-SETUP.md) troubleshooting section

### "Changes don't save after refresh"
- This is expected without backend
- Backend not yet implemented in this session
- See "Connecting to the Backend" section above

---

## Next Steps

1. **Try the UI:**
   ```bash
   npm run dev
   ```
   Click around, test the node editor

2. **Learn Two-Way Sync:**
   - Create nodes visually
   - Edit code directly
   - Watch them sync

3. **Implement Backend** (when ready):
   - Follow [BACKEND-SETUP.md](./BACKEND-SETUP.md)
   - Takes ~2-3 hours for experienced developer
   - Cloudflare Workers docs: https://developers.cloudflare.com/workers/

4. **Deploy:**
   - Frontend: Cloudflare Pages
   - Backend: Cloudflare Workers
   - Database: Cloudflare D1

---

## Resources

- **Node Editor Lib:** [React Flow Docs](https://reactflow.dev)
- **UI Framework:** [Tailwind CSS](https://tailwindcss.com)
- **State Management:** [Zustand Docs](https://github.com/pmndrs/zustand)
- **Backend:** [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- **Database:** [D1 SQL Database](https://developers.cloudflare.com/workers/platform/databases/)

---

## Questions?

Check:
1. [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) - Architecture deep-dive
2. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - File/API reference
3. [BACKEND-SETUP.md](./BACKEND-SETUP.md) - Backend implementation
4. [UPDATE-SUMMARY.md](./UPDATE-SUMMARY.md) - What's new in this version
