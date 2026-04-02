# 📋 File Manifest - Hypixel Housing HTSL Editor

## Project Structure & File Guide

### 📁 Root Files

| File | Purpose | Type |
|------|---------|------|
| `package.json` | Dependencies & npm scripts | Configuration |
| `vite.config.js` | Vite build configuration | Build Config |
| `tailwind.config.js` | Tailwind CSS configuration | Build Config |
| `postcss.config.js` | PostCSS configuration | Build Config |
| `index.html` | HTML entry point | HTML |
| `.gitignore` | Git ignore rules | Configuration |
| `README.md` | Comprehensive documentation | Documentation |
| `QUICKSTART.md` | Quick setup guide | Documentation |
| `PROJECT-OVERVIEW.md` | Project overview & features | Documentation |
| `FILE-MANIFEST.md` | This file | Documentation |

### 📁 src/ - Source Code

#### Main Application
| File | Purpose | Lines |
|------|---------|-------|
| `App.jsx` | Main React component (split-screen UI) | ~350 |
| `main.jsx` | React entry point | ~10 |
| `index.css` | Global styles & Tailwind imports | ~70 |

#### Components (src/components/)
| File | Purpose | Lines |
|------|---------|-------|
| `EventNode.jsx` | Event node component (blue) | ~45 |
| `ActionNode.jsx` | Action node component (green, 8 types) | ~195 |
| `ConditionNode.jsx` | Condition node component (purple) | ~135 |

#### Utils (src/utils/)
| File | Purpose | Lines |
|------|---------|-------|
| `htslCompiler.js` | HTSL code generator (50+ lines per function) | ~340 |
| `examples.js` | Usage examples & test cases | ~175 |

---

## 📊 Statistics

### Code Files
- **Total Components:** 3 (Event, Action, Condition)
- **Total Action Types:** 8
- **Total Condition Types:** 3
- **Total Lines of Code:** ~1,300+
- **Total Configuration Files:** 4

### Documentation
- **README.md:** Comprehensive guide (400+ lines)
- **QUICKSTART.md:** Quick start guide (250+ lines)
- **PROJECT-OVERVIEW.md:** Feature overview (450+ lines)
- **Total Documentation:** 1,100+ lines

---

## 🔧 Key Files & Their Roles

### Application Flow

```
1. index.html (browser entry)
   ↓
2. src/main.jsx (React setup)
   ↓
3. src/App.jsx (main component)
   ├── Left: React Flow Canvas
   ├── Node Components:
   │   ├── EventNode.jsx
   │   ├── ActionNode.jsx
   │   └── ConditionNode.jsx
   └── Right: Code Preview
       ├── Live update from:
       │   └── htslCompiler.js
       └── Copy/Download buttons
```

### Build Process

```
1. vite.config.js (build config)
2. tailwind.config.js (CSS setup)
3. postcss.config.js (CSS processing)
4. index.html (HTML template)
5. src/** (source code)
   ↓ (npm run build)
   ↓
dist/ (production build)
```

---

## 📦 Dependencies (from package.json)

### Production
- `react` (18.2.0) - UI framework
- `react-dom` (18.2.0) - React DOM renderer
- `reactflow` (11.10.0) - Node editor
- `zustand` (4.4.0) - State management

### Development
- `@vitejs/plugin-react` (4.0.0) - Vite React plugin
- `vite` (4.3.9) - Build tool
- `tailwindcss` (3.3.0) - CSS framework
- `postcss` (8.4.24) - CSS processor
- `autoprefixer` (10.4.14) - CSS vendor prefixes

---

## 🎯 Quick File Reference

### Need to...

| Task | Edit This File |
|------|--------|
| Change UI styling | `src/index.css` |
| Add new colors/theme | `tailwind.config.js` |
| Add node types | `App.jsx` & `src/components/` |
| Add action types | `src/components/ActionNode.jsx` & `src/utils/htslCompiler.js` |
| Fix compiler logic | `src/utils/htslCompiler.js` |
| Update docs | `README.md` or `QUICKSTART.md` |
| Configure build | `vite.config.js` |
| Add dependencies | `package.json` |

---

## 🚀 Build Outputs

### Development
```
npm run dev
↓
Starts: http://localhost:5173
With: Hot module reload, source maps
```

### Production
```
npm run build
↓
Creates: dist/
├── index.html (minified)
├── assets/
│   ├── index-[hash].js (bundled React + app)
│   └── index-[hash].css (minified styles)
└── Other assets
```

### Preview Production Build
```
npm run preview
↓
Serves: dist/ locally for testing
```

---

## 📝 Document Guide

### README.md
- **What:** Complete project documentation
- **For:** Users and developers
- **Contains:** Features, setup, usage, API reference, troubleshooting

### QUICKSTART.md
- **What:** Fast setup guide
- **For:** New users wanting to get started immediately
- **Contains:** Installation, quick examples, common commands

### PROJECT-OVERVIEW.md
- **What:** High-level project overview
- **For:** Stakeholders and understanding big picture
- **Contains:** Features, examples, architecture, deployment

### FILE-MANIFEST.md (This File)
- **What:** File structure and reference guide
- **For:** Developers navigating the codebase
- **Contains:** File listing, statistics, quick reference

---

## ✅ All Files Created

- [x] Configuration files (4)
- [x] React components (3)
- [x] Utility functions (2)
- [x] Entry files (2)
- [x] Styling (1)
- [x] Documentation (4)
- [x] Ignore rules (.gitignore)

**Total: 18 production/documentation files**

---

## 🎓 Getting Started

1. **Read:** `QUICKSTART.md` (5 min)
2. **Install:** `npm install` (2 min)
3. **Run:** `npm run dev` (1 min)
4. **Build:** Create your first workflow (10 min)

---

## 🔗 File Relationships

```
App.jsx (main)
├── imports EventNode from components/EventNode.jsx
├── imports ActionNode from components/ActionNode.jsx  
├── imports ConditionNode from components/ConditionNode.jsx
├── imports generateHTSL from utils/htslCompiler.js
└── uses index.css for styling

htslCompiler.js
├── Called by App.jsx on nodes/edges change
├── Uses functions: traverseFromNode, getEventTrigger, etc.
└── Returns HTSL code string

Each Node Component
├── Imported by App.jsx
├── Receives data prop
├── Renders handles from reactflow
└── Calls data.onUpdate callback
```

---

## 📈 Lines of Code Summary

| Category | Files | Lines |
|----------|-------|-------|
| React Components | 3 | ~375 |
| Utilities | 2 | ~515 |
| Configuration | 4 | ~60 |
| Styling | 1 | ~70 |
| Entry Points | 2 | ~20 |
| **Source Total** | **12** | **~1,040** |
| Documentation | 4 | **~1,100** |
| **Project Total** | **16** | **~2,140** |

---

## 🎯 Next Steps

1. **Verify Installation:**
   ```bash
   npm install
   ```

2. **Start Development:**
   ```bash
   npm run dev
   ```

3. **Make Changes:**
   - Edit any `.jsx` files
   - Changes auto-reload in browser
   - Check console for errors

4. **Build for Production:**
   ```bash
   npm run build
   ```

5. **Deploy:**
   - Copy `dist/` folder to web server
   - Serve `index.html`

---

## 📞 Support Resources

- **React:** https://react.dev/
- **React Flow:** https://reactflow.dev/
- **Tailwind:** https://tailwindcss.com/
- **Vite:** https://vitejs.dev/

---

**Last Updated:** April 2, 2026
**Status:** ✅ Production Ready
**Version:** 1.0.0
