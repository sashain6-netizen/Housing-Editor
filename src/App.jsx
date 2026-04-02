import React, { useCallback, useRef, useState, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";

import EventNode from "./components/EventNode";
import ActionNode from "./components/ActionNode";
import ConditionNode from "./components/ConditionNode";
import { generateHTSL } from "./utils/htslCompiler";

/**
 * Main App Component - Visual Node Editor for Hypixel Housing HTSL
 * 
 * Features:
 * - Split-screen layout: Node canvas (left) + Code preview (right)
 * - Three node types: Event, Action, Condition
 * - Live HTSL code generation
 * - Node management (add, delete, update)
 */
function App() {
  const nodeIdRef = useRef(0);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [htslCode, setHTSLCode] = useState("// Empty - Start by adding an Event node");

  // Define custom node types
  const nodeTypes = {
    event: EventNode,
    action: ActionNode,
    condition: ConditionNode,
  };

  /**
   * Update HTSL code whenever nodes or edges change
   */
  useEffect(() => {
    const code = generateHTSL(nodes, edges);
    setHTSLCode(code);
  }, [nodes, edges]);

  /**
   * Handle node connections
   */
  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  /**
   * Add a new node of specified type
   */
  const addNode = useCallback(
    (type) => {
      const newNodeId = `${type}_${nodeIdRef.current++}`;
      let nodeData = { onUpdate: (data) => updateNodeData(newNodeId, data) };

      // Set default values based on node type
      if (type === "event") {
        nodeData.eventType = "PlayerJoin";
      } else if (type === "action") {
        nodeData.actionType = "SendMessage";
        nodeData.message = "Welcome!";
      } else if (type === "condition") {
        nodeData.conditionType = "StatCheck";
        nodeData.statName = "coins";
        nodeData.operator = ">=";
        nodeData.compareValue = 10;
      }

      const newNode = {
        id: newNodeId,
        data: nodeData,
        position: { x: Math.random() * 500, y: Math.random() * 300 },
        type: type,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  /**
   * Update node data (for form inputs in nodes)
   */
  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...newData } };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  /**
   * Delete selected nodes or edges
   */
  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  /**
   * Clear entire graph
   */
  const handleClear = useCallback(() => {
    if (window.confirm("Clear all nodes and edges?")) {
      setNodes([]);
      setEdges([]);
      nodeIdRef.current = 0;
    }
  }, [setNodes, setEdges]);

  /**
   * Copy HTSL code to clipboard
   */
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(htslCode);
    alert("HTSL code copied to clipboard!");
  }, [htslCode]);

  /**
   * Download HTSL code as file
   */
  const downloadHTSL = useCallback(() => {
    const element = document.createElement("a");
    const file = new Blob([htslCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "housing.htsl";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [htslCode]);

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* LEFT PANEL - React Flow Canvas */}
      <div className="flex-1 flex flex-col border-r border-slate-700">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <h1 className="text-2xl font-bold text-blue-400 mb-3">
            🏠 Hypixel Housing HTSL Editor
          </h1>

          {/* Node Type Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => addNode("event")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-sm transition"
            >
              + Event
            </button>
            <button
              onClick={() => addNode("action")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold text-sm transition"
            >
              + Action
            </button>
            <button
              onClick={() => addNode("condition")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold text-sm transition"
            >
              + Condition
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold text-sm transition"
            >
              🗑️ Delete
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded font-semibold text-sm transition"
            >
              Clear All
            </button>
          </div>

          {/* Stats */}
          <div className="mt-3 text-xs text-slate-400">
            Nodes: <span className="font-bold text-slate-200">{nodes.length}</span> | Edges:{" "}
            <span className="font-bold text-slate-200">{edges.length}</span>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Help Text */}
        <div className="bg-slate-800 border-t border-slate-700 p-3 text-xs text-slate-400">
          💡 <strong>Tip:</strong> Drag nodes to arrange | Connect nodes with edges | Delete nodes by selecting and clicking Delete
        </div>
      </div>

      {/* RIGHT PANEL - HTSL Code Preview */}
      <div className="w-1/3 flex flex-col border-l border-slate-700 bg-slate-800">
        {/* Header */}
        <div className="bg-slate-700 border-b border-slate-600 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-green-400">📄 HTSL Output</h2>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs font-semibold transition"
              title="Copy to clipboard"
            >
              📋 Copy
            </button>
            <button
              onClick={downloadHTSL}
              className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs font-semibold transition"
              title="Download as .htsl file"
            >
              ⬇️ Download
            </button>
          </div>
        </div>

        {/* Code Editor Area */}
        <textarea
          value={htslCode}
          readOnly
          className="flex-1 p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none border-none focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="// HTSL code will appear here as you build your node graph"
        />

        {/* Info Panel */}
        <div className="bg-slate-700 border-t border-slate-600 p-3 text-xs text-slate-300">
          <p className="mb-2">
            <strong>📌 Getting Started:</strong>
          </p>
          <ul className="space-y-1 text-slate-400 ml-2">
            <li>1. Add an Event node (the entry point)</li>
            <li>2. Add Action nodes to execute commands</li>
            <li>3. Chain them with edges</li>
            <li>4. Optionally add Conditions for branching</li>
            <li>5. Watch the HTSL code generate live!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
