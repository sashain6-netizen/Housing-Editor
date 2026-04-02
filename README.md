# 🏠 Hypixel Housing HTSL Editor

A professional **React-based Visual Node Editor** for generating Hypixel Housing HTSL (Housing Text Scripting Language) code.

## ✨ Features

- **Visual Node Editor** - Drag-and-drop node-based interface powered by React Flow
- **Three Node Types**:
  - **Event Nodes** - Entry points (PlayerJoin, PlayerKill, PlayerDeath, etc.)
  - **Action Nodes** - Executable commands (SendMessage, GiveItem, Teleport, SetStat, PlaySound, etc.)
  - **Condition Nodes** - Decision branches (StatCheck, ItemCheck, TimeCheck)
- **Live HTSL Code Generation** - Real-time compilation as you build
- **Split-Screen Interface** - Node canvas (left) + Code preview (right)
- **Export Options** - Copy to clipboard or download as `.htsl` file
- **Professional UI** - Dark theme with Tailwind CSS

## 🛠️ Tech Stack

- **React 18** - UI framework
- **React Flow** - Node-based graph editor
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool
- **PostCSS & Autoprefixer** - CSS processing

## 📦 Installation

1. **Clone or navigate to the project**:
   ```bash
   cd "c:\Projects\Housing Editor"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🎮 Usage Guide

### Getting Started

1. **Add an Event Node** - Click "+ Event" to create a trigger (PlayerJoin, PlayerKill, etc.)
2. **Add Action Nodes** - Click "+ Action" to add commands (SendMessage, GiveItem, etc.)
3. **Connect Nodes** - Drag from an output handle to an input handle to create edges
4. **Optional: Add Conditions** - Click "+ Condition" to create decision branches (if/else)
5. **View Generated Code** - Watch the HTSL code update in the right panel
6. **Export** - Copy or download your HTSL code

### Node Types

#### 📌 Event Node
- **Purpose**: Entry point for HTSL execution
- **Examples**: PlayerJoin, PlayerKill, PlayerDeath, PlayerMove, BlockClick
- **Output**: Single connection to next node

#### ⚙️ Action Node
- **Purpose**: Execute commands in the script
- **Types**:
  - `SendMessage` - Display text to player (requires: message)
  - `GiveItem` - Give items to player (requires: itemName, count)
  - `Teleport` - Move player to coordinates (requires: x, y, z)
  - `SetStat` - Modify player statistics (requires: statName, value)
  - `PlaySound` - Play a sound effect (requires: soundName)
  - `Delay` - Pause execution (requires: delayMs)
  - `ClearInventory` - Empty player inventory
  - `Kill` - Kill player
- **Inputs/Outputs**: Input from top, output to bottom

#### 🔀 Condition Node
- **Purpose**: Create branching logic (if/else)
- **Types**:
  - `StatCheck` - Check player statistics (requires: statName, operator, compareValue)
  - `ItemCheck` - Check if player has items (requires: itemName, minQuantity)
  - `TimeCheck` - Check current time (requires: hour, minute)
- **Outputs**: 
  - Green handle (left) - "True" path
  - Red handle (right) - "False" path

### Example Workflow

```
Event (PlayerJoin)
    ↓
Action (SendMessage: "Welcome!")
    ↓
Condition (StatCheck: coins >= 10)
    ├─→ Action (GiveItem: Diamond, 5)
    └─→ Action (SendMessage: "Not enough coins")
```

**Generated HTSL**:
```
on_event "PlayerJoin" {
  send_message "Welcome!"
  if (stat "coins" >= 10) {
    give_item "Diamond" 5
  }
  else {
    send_message "Not enough coins"
  }
}
```

## 📁 Project Structure

```
Housing Editor/
├── src/
│   ├── components/
│   │   ├── EventNode.jsx      # Event node component
│   │   ├── ActionNode.jsx     # Action node component
│   │   └── ConditionNode.jsx  # Condition node component
│   ├── utils/
│   │   └── htslCompiler.js    # HTSL code generator
│   ├── App.jsx                # Main application component
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles & Tailwind
├── index.html                 # HTML entry point
├── package.json               # Dependencies & scripts
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── README.md                  # This file
```

## 🔧 Key Components

### HTSL Compiler (`src/utils/htslCompiler.js`)

The compiler traverses the node graph starting from Event nodes and generates HTSL code:

```javascript
import { generateHTSL } from "./utils/htslCompiler";

const nodes = [...];
const edges = [...];
const code = generateHTSL(nodes, edges);
```

**Key Features**:
- Flat structure (no deeply nested functions)
- Supports branching with if/else
- Prevents infinite loops with visited tracking
- Handles all three node types

### Node Components

Each node provides:
- Visual UI with color coding (blue=event, green=action, purple=condition)
- Dynamic input fields based on node data
- Handles for connections (input/output)
- Real-time data updates

## ⚙️ API Reference

### generateHTSL(nodes, edges)

Generates HTSL code from a node graph.

**Parameters**:
- `nodes` (Array): Array of node objects with `id`, `type`, and `data` properties
- `edges` (Array): Array of edge objects with `source` and `target` properties

**Returns**: String containing HTSL code

**Example**:
```javascript
const nodes = [
  { id: "event_0", type: "event", data: { eventType: "PlayerJoin" } },
  { id: "action_1", type: "action", data: { actionType: "SendMessage", message: "Hello!" } }
];

const edges = [
  { source: "event_0", target: "action_1" }
];

const code = generateHTSL(nodes, edges);
// Output: on_event "PlayerJoin" {\n  send_message "Hello!"\n}
```

## 🎨 Customization

### Adding New Action Types

Edit `src/utils/htslCompiler.js` and add a new case to `generateActionCode()`:

```javascript
case "MyCustomAction":
  const myValue = data.myValue || "default";
  return `  my_command "${myValue}"`;
```

Then add to `src/components/ActionNode.jsx`:

```javascript
{actionType === "MyCustomAction" && (
  <div className="mb-3">
    <label className="text-xs font-semibold block mb-1">Value:</label>
    <input
      type="text"
      value={data.myValue || ""}
      onChange={(e) => data.onUpdate?.({ ...data, myValue: e.target.value })}
      className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
    />
  </div>
)}
```

### Themes

Modify Tailwind colors in `tailwind.config.js` or edit CSS classes in component files.

## 🐛 Troubleshooting

**Issue**: "No event node found" error message
- **Solution**: Always start with at least one Event node. Events are required as entry points.

**Issue**: Nodes won't connect
- **Solution**: Ensure you're connecting from an output handle (bottom) to an input handle (top).

**Issue**: Code not updating
- **Solution**: Check the browser console for JavaScript errors. Refresh the page if needed.

## 📝 HTSL Language Reference

Supported HTSL commands:

```
on_event "<event_type>" { ... }
send_message "<message>"
give_item "<item_name>" <count>
teleport <x> <y> <z>
set_stat "<stat_name>" <value>
play_sound "<sound_name>"
delay <milliseconds>
clear_inventory
kill_player
if (<condition>) { ... }
else { ... }
```

## 🚀 Performance Tips

- Use events as natural breakpoints in your logic
- Avoid extremely long chains of actions
- Use conditions to create manageable code blocks
- Test generated code frequently

## 📄 License

This project is provided as-is for Hypixel Housing development.

## 🤝 Contributing

Feel free to extend this editor with:
- Additional node types
- New action types
- Advanced condition checks
- Export formats (JSON, XML, etc.)

---

**Happy Housing Scripting! 🏠✨**
