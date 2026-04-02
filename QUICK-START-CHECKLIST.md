# 🚀 Quick Start Checklist

Complete this checklist to get the Housing Editor running locally in under 10 minutes.

## ✅ Prerequisites (2 minutes)

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed or project downloaded
- [ ] Code editor open (VS Code recommended)

## ✅ Installation (3 minutes)

```bash
# Navigate to project directory
cd "c:\Projects\Housing Editor"

# Install dependencies
npm install
```

- [ ] Command completes without errors
- [ ] `node_modules/` folder appears

## ✅ Environment Setup (1 minute)

```bash
# Copy environment template
cp .env.example .env.local
```

File `.env.local` should now contain:
```
REACT_APP_API_URL=http://localhost:8787
```

- [ ] `.env.local` file exists
- [ ] Contains `REACT_APP_API_URL`

## ✅ Start Development Server (1 minute)

```bash
npm run dev
```

Expected output:
```
  VITE v4.3.x ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

- [ ] Server starts successfully
- [ ] No errors in terminal

## ✅ Open in Browser (1 minute)

1. Open http://localhost:5173 in your browser
2. You should see the Landing Page with:
   - "Housing Editor" title
   - Feature overview
   - Sign In / Get Started buttons

- [ ] Landing page appears
- [ ] No console errors (F12)
- [ ] Can click buttons

## ✅ Test the Visual Node Editor

### Test 1: Add Nodes
1. Look for buttons: "+ Event", "+ Action", "+ Condition"
2. Click "+ Event"
3. A blue node appears on the canvas

- [ ] Event node created
- [ ] Can see node on canvas

### Test 2: Watch Two-Way Sync (THIS IS THE KEY FEATURE)
1. Right-click event node and edit the event name
2. **Look at the right panel** - HTSL code appears automatically
3. Edit the code in the right panel
4. **Watch the left panel** - Nodes update from code

- [ ] Code updates when drawing visual
- [ ] Visual updates when editing code
- [ ] Two-way sync works ✨

### Test 3: Add an Action
1. Click "+ Action"
2. An orange node appears below the event
3. Connect event to action by dragging handles
4. **Check right panel** - HTSL code updated

- [ ] Action node created
- [ ] Can connect nodes
- [ ] Code reflects the structure

## ✅ Explore the UI

- [ ] Click "Sign In" (form appears, won't submit without backend)
- [ ] Click "Get Started" (same as Sign In)
- [ ] Try the code editor buttons: Copy, Download, Select All, Clear

## ✅ Backend (Optional for Full Features)

**What works right now:**
- ✅ Node editing UI
- ✅ Two-way code sync
- ✅ Visual display and manipulation
- ✅ HTSL code generation/parsing

**What needs backend:**
- ❌ User login/registration
- ❌ Saving houses
- ❌ Loading previous work
- ❌ Auto-save to cloud

**To add backend later:**
1. Read [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) → Connecting to Backend
2. Follow [BACKEND-SETUP.md](./BACKEND-SETUP.md)
3. Deploy to Cloudflare Workers

For now, skip this. The frontend is complete and usable.

- [ ] Backend skipped for now (can add later)

## ✅ You're Done! 🎉

The Housing Editor is now running locally.

### What's Next?

**Option A: Explore the Code**
- Open `src/pages/EditorPage.jsx` - main editor
- Open `src/utils/htslCompiler.js` - visual to code
- Open `src/utils/htslParser.js` - code to visual
- Try adding more node types

**Option B: Read Documentation**
- [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md) - Complete guide to all docs
- [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) - Deep dive on two-way sync
- [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md) - Architecture overview

**Option C: Implement Backend**
- [BACKEND-SETUP.md](./BACKEND-SETUP.md) - Full backend guide
- Takes ~2-3 hours to implement
- Enables user accounts and cloud save

### If Something Went Wrong

❌ **"npm install fails"**
- Delete `node_modules/` folder
- Run `npm install` again
- Check Node.js version: `node --version` (should be 16+)

❌ **"http://localhost:5173 is blank"**
- Check terminal for errors
- Press F12 to open browser console
- Look for red error messages

❌ **"Two-way sync not working"**
- Make sure you edited the code panel on the right
- Code changes take a moment to parse
- Check browser console for errors
- Try refreshing the page

See [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) → Troubleshooting for more help.

---

## 📁 Key Files You Should Know

| File | Purpose |
|------|---------|
| `src/pages/EditorPage.jsx` | Main editor with split-screen |
| `src/utils/htslCompiler.js` | Converts visual → code |
| `src/utils/htslParser.js` | Converts code → visual |
| `src/store/appStore.js` | User & house data storage |
| `src/App.jsx` | Route definitions |
| `src/components/` | UI components |

## 🎯 Core Feature: Two-Way Sync

This is what makes Housing Editor special:

```
Visual Editor ←→ HTSL Code
   (draw/edit)     (write/edit)
        ↑                ↑
        └────────────────┘
         Automatic Sync
```

Edit on either side, the other updates instantly. No manual "compile" button needed.

## ✨ You're All Set!

**Have questions?** Check [DOCUMENTATION-INDEX.md](./DOCUMENTATION-INDEX.md)

**Found a bug?** Check [DEVELOPER-GUIDE.md](./DEVELOPER-GUIDE.md) → Troubleshooting

**Ready to deploy?** Start with [BACKEND-SETUP.md](./BACKEND-SETUP.md)

Happy editing! 🏠✨
