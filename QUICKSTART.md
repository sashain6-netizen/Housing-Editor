# 🚀 Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

This will install:
- **react** & **react-dom** - UI framework
- **reactflow** - Node graph editor
- **zustand** - State management
- **tailwindcss** - Styling
- **vite** - Build tool
- **postcss** & **autoprefixer** - CSS processing

### 2. Start Development Server
```bash
npm run dev
```

This starts Vite on `http://localhost:5173` and opens it automatically.

### 3. Build for Production
```bash
npm run build
```

Output will be in the `dist/` folder.

## 📋 Project Files Overview

### Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main React component with split-screen layout |
| `src/components/EventNode.jsx` | Event node component |
| `src/components/ActionNode.jsx` | Action node component |
| `src/components/ConditionNode.jsx` | Condition node component |
| `src/utils/htslCompiler.js` | HTSL code generator |
| `src/index.css` | Global styles & Tailwind imports |
| `tailwind.config.js` | Tailwind CSS configuration |
| `vite.config.js` | Vite build configuration |

### Features Included

✅ React Flow integration for node canvas
✅ Three custom node types (Event, Action, Condition)
✅ 8 action types with dynamic input fields
✅ 3 condition types with branching support
✅ Live HTSL code generation
✅ Copy to clipboard & download functionality
✅ Dark theme with professional UI
✅ Fully responsive split-screen layout

## 🎯 How It Works

1. **User adds nodes** → Event, Action, Condition
2. **User connects nodes** with edges
3. **HTSL Compiler traverses** the graph starting from Event nodes
4. **Generated code** appears live in the right panel
5. **User can copy or download** the HTSL code

## 🔧 Customization Examples

### Add a New Action Type

1. **Update `htslCompiler.js`**:
```javascript
case "MyAction":
  const myParam = data.myParam || "default";
  return `  my_command "${myParam}"`;
```

2. **Update `ActionNode.jsx`**:
```javascript
{actionType === "MyAction" && (
  <div className="mb-3">
    <label className="text-xs font-semibold block mb-1">Parameter:</label>
    <input
      type="text"
      value={data.myParam || ""}
      onChange={(e) => data.onUpdate?.({ ...data, myParam: e.target.value })}
      className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
    />
  </div>
)}
```

3. **Add to actionTypes array** in ActionNode.jsx.

## 📚 Component Structure

### EventNode
- **Inputs**: None (starting point)
- **Outputs**: Single bottom handle
- **Data**: eventType (PlayerJoin, PlayerKill, etc.)

### ActionNode
- **Inputs**: Top handle
- **Outputs**: Bottom handle
- **Data**: Depends on actionType (message, coordinates, etc.)

### ConditionNode
- **Inputs**: Top handle
- **Outputs**: 
  - Left (green) = True path
  - Right (red) = False path
- **Data**: Condition parameters

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No event node found" | Add at least one Event node first |
| Nodes won't connect | Ensure connecting from output (bottom) to input (top) |
| Code not updating | Check browser console for errors, refresh page |
| Styling looks wrong | Make sure Tailwind CSS is built (`npm run dev`) |

## 📊 HTSL Code Examples

### Simple Message
```
on_event "PlayerJoin" {
  send_message "Welcome!"
}
```

### Reward Based on Stat
```
on_event "PlayerJoin" {
  if (stat "coins" >= 100) {
    give_item "Diamond" 5
  }
  else {
    send_message "Get more coins"
  }
}
```

### Complex Logic
```
on_event "BlockClick" {
  if (item_count "Diamond" >= 1) {
    give_item "Emerald" 3
  }
  else {
    send_message "You need a diamond"
  }
}
```

## 🔗 Supported HTSL Commands

| Command | Parameters | Example |
|---------|-----------|---------|
| `on_event` | event_type | `on_event "PlayerJoin" { ... }` |
| `send_message` | message | `send_message "Hello!"` |
| `give_item` | item_name, count | `give_item "Diamond" 5` |
| `teleport` | x, y, z | `teleport 0 64 0` |
| `set_stat` | stat_name, value | `set_stat "coins" 100` |
| `play_sound` | sound_name | `play_sound "entity.player.levelup"` |
| `delay` | milliseconds | `delay 1000` |
| `clear_inventory` | - | `clear_inventory` |
| `kill_player` | - | `kill_player` |
| `if` | condition | `if (stat "coins" >= 10) { ... }` |
| `else` | - | `else { ... }` |

## 💡 Pro Tips

1. **Start with an Event** - The compiler needs an entry point
2. **Test frequently** - Generate and review HTSL code often
3. **Use descriptive names** - In messages and item names
4. **Avoid deep nesting** - Keep logic flat per Hypixel constraints
5. **Use conditions for branching** - They create if/else blocks

## 🚀 Next Steps

1. Run `npm install` to install dependencies
2. Run `npm run dev` to start the editor
3. Add nodes and connect them
4. Watch the HTSL code generate live
5. Copy or download your code

---

**Made for Hypixel Housing Developers 🏠**
