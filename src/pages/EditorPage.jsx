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
import { useParams, useNavigate } from "react-router-dom";
import "reactflow/dist/style.css";

import EventNode from "../components/EventNode";
import ActionNode from "../components/ActionNode";
import ConditionNode from "../components/ConditionNode";
import CodeEditor from "../components/CodeEditor";
import { generateHTSL } from "../utils/htslCompiler";
import { parseHTSLToNodes } from "../utils/htslParser";
import { useHousingStore, useAuthStore } from "../store/appStore";
import { debounce } from "lodash";

/**
 * EditorPage - Main HTSL editing interface with two-way sync
 * Left: Visual node editor
 * Right: Code editor (two-way sync)
 */
function EditorPage() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentHouse, fetchHouse, updateHouse, isLoading: housingLoading } = useHousingStore();

  const nodeIdRef = useRef(0);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [htslCode, setHTSLCode] = useState("// Empty - Start by adding an Event node");
  const [syncMode, setSyncMode] = useState("visual"); // "visual" or "code"
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const nodeTypes = {
    event: EventNode,
    action: ActionNode,
    condition: ConditionNode,
  };

  // Fetch house on mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (houseId) {
      fetchHouse(houseId);
    }
  }, [houseId, user]);

  // Load house data when fetched
  useEffect(() => {
    if (currentHouse && currentHouse.code) {
      try {
        const { nodes: parsedNodes, edges: parsedEdges } = parseHTSLToNodes(currentHouse.code);
        setNodes(parsedNodes);
        setEdges(parsedEdges);
        setHTSLCode(currentHouse.code);
        setSyncMode("visual");
      } catch (error) {
        console.error("Error parsing house code:", error);
      }
    }
  }, [currentHouse]);

  // Auto-save to database
  const debouncedSave = useCallback(
    debounce(async (code) => {
      if (!houseId || !code) return;

      setIsSaving(true);
      try {
        await updateHouse(houseId, { code });
        setLastSaveTime(new Date());
      } catch (error) {
        console.error("Save error:", error);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [houseId, updateHouse]
  );

  // Update HTSL code when nodes/edges change (visual editor)
  useEffect(() => {
    const code = generateHTSL(nodes, edges);
    setHTSLCode(code);
    setSyncMode("visual");
    debouncedSave(code);
  }, [nodes, edges]);

  // Handle code changes from code editor
  const handleCodeChange = (newCode) => {
    setHTSLCode(newCode);
    setSyncMode("code");
    
    try {
      // Parse code to nodes
      const { nodes: parsedNodes, edges: parsedEdges } = parseHTSLToNodes(newCode);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
    } catch (error) {
      console.error("Parse error:", error);
      // Keep visual editor as-is if parsing fails
    }

    debouncedSave(newCode);
  };

  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (type) => {
      const newNodeId = `${type}_${nodeIdRef.current++}`;
      let nodeData = { onUpdate: (data) => updateNodeData(newNodeId, data) };

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

  const handleDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  const handleClear = useCallback(() => {
    if (window.confirm("Clear all nodes and edges?")) {
      setNodes([]);
      setEdges([]);
      nodeIdRef.current = 0;
    }
  }, [setNodes, setEdges]);

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* LEFT PANEL - React Flow Canvas */}
      <div className="flex-1 flex flex-col border-r border-slate-700">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="text-2xl font-bold text-blue-400">
                🏠 {currentHouse?.name || "Loading..."}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {currentHouse?.description}
              </p>
            </div>
            <button
              onClick={handleBackToDashboard}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm font-semibold"
            >
              ← Dashboard
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4 text-xs mb-3">
            <span className={isSaving ? "text-yellow-400" : "text-green-400"}>
              {isSaving ? "💾 Saving..." : "✓ Saved"}
            </span>
            {lastSaveTime && (
              <span className="text-slate-400">
                Last saved: {lastSaveTime.toLocaleTimeString()}
              </span>
            )}
            <span className="text-slate-400">
              Mode: <span className="font-bold text-blue-300">{syncMode === "visual" ? "📊 Visual" : "📝 Code"}</span>
            </span>
          </div>

          {/* Controls */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => addNode("event")}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-sm transition"
            >
              + Event
            </button>
            <button
              onClick={() => addNode("action")}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold text-sm transition"
            >
              + Action
            </button>
            <button
              onClick={() => addNode("condition")}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded font-semibold text-sm transition"
            >
              + Condition
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold text-sm transition"
            >
              🗑️ Delete
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-700 rounded font-semibold text-sm transition"
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
      </div>

      {/* RIGHT PANEL - Code Editor */}
      <div className="w-2/5 flex flex-col border-l border-slate-700 bg-slate-800 p-4 overflow-hidden">
        <CodeEditor
          code={htslCode}
          onCodeChange={handleCodeChange}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}

export default EditorPage;
