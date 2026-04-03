import React, { useCallback, useRef, useState, useEffect } from "react";
import ReactFlow, {
  addEdge,
  Background,
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
  const houseIdRef = useRef(houseId); // Ref to store current houseId
  const isInitialLoadRef = useRef(true); // Track initial load
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [htslCode, setHTSLCode] = useState("// Empty - Start by adding an Event node");
  const [syncMode, setSyncMode] = useState("visual"); // "visual" or "code"
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [accessError, setAccessError] = useState(null);

  // Update houseId ref when houseId changes
  useEffect(() => {
    houseIdRef.current = houseId;
  }, [houseId]);

  const nodeTypes = {
    event: EventNode,
    action: ActionNode,
    condition: ConditionNode,
  };

  // Fetch house on mount
  useEffect(() => {
    if (!user) {
      setAccessError("You need to be logged in to access this page.");
      return;
    }

    if (houseId) {
      fetchHouse(houseId).catch((error) => {
        if (error.response?.status === 403) {
          setAccessError("You don't have permission to access this house.");
        } else if (error.response?.status === 404) {
          setAccessError("This house doesn't exist.");
        } else {
          setAccessError("Failed to load house. Please try again.");
        }
      });
    }
  }, [houseId, user]);

  // Load house data when fetched
  useEffect(() => {
    if (currentHouse) {
      // First, set the code regardless
      setHTSLCode(currentHouse.code || "// Empty - Start by adding an Event node");
      
      // Try to load node data if it exists
      if (currentHouse.node_data) {
        try {
          const nodeData = JSON.parse(currentHouse.node_data);
          if (nodeData.nodes && nodeData.edges) {
            console.log("Loading saved node structure:", nodeData.nodes.length, "nodes,", nodeData.edges.length, "edges");
            setNodes(nodeData.nodes);
            setEdges(nodeData.edges);
            setSyncMode(nodeData.syncMode || "visual");
            isInitialLoadRef.current = false;
            return; // Skip code parsing since we have node data
          }
        } catch (error) {
          console.error("Error parsing node data:", error);
          // Fall back to code parsing
        }
      }
      
      // Only parse code to nodes if this is the initial load and we don't have existing nodes
      if (currentHouse.code && isInitialLoadRef.current) {
        try {
          const { nodes: parsedNodes, edges: parsedEdges } = parseHTSLToNodes(currentHouse.code);
          if (parsedNodes && parsedEdges) {
            setNodes(parsedNodes);
            setEdges(parsedEdges);
            setSyncMode("visual");
          }
        } catch (error) {
          console.error("Error parsing house code:", error);
          // Set empty state if parsing fails
          setNodes([]);
          setEdges([]);
          setSyncMode("code");
        }
        isInitialLoadRef.current = false;
      } else if (!currentHouse.code && isInitialLoadRef.current) {
        // Empty house
        setNodes([]);
        setEdges([]);
        setSyncMode("visual");
        isInitialLoadRef.current = false;
      }
    }
  }, [currentHouse]);

  // Auto-save to database
  const debouncedSave = useCallback(
    debounce(async (code) => {
      const currentHouseId = houseIdRef.current; // Get current value from ref
      if (!currentHouseId) {
        console.log("Save skipped: missing houseId", { houseId: currentHouseId });
        return;
      }

      // Create node data structure
      const nodeData = {
        nodes: nodes,
        edges: edges,
        syncMode: syncMode
      };

      console.log("Attempting to save house:", currentHouseId, "with code length:", code?.length || 0, "nodes:", nodes.length, "edges:", edges.length);
      setIsSaving(true);
      try {
        await updateHouse(currentHouseId, { 
          code: code || "", 
          node_data: JSON.stringify(nodeData)
        });
        setLastSaveTime(new Date());
        console.log("Save successful for house:", currentHouseId);
      } catch (error) {
        console.error("Save error:", error);
        alert(`Failed to save: ${error.response?.data?.message || error.message}`);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    [updateHouse, nodes, edges, syncMode]
  );

  // Update HTSL code when nodes/edges change (visual editor)
  useEffect(() => {
    // Only generate code if we're not in the middle of loading or saving
    if (!housingLoading && !isSaving && syncMode === "visual") {
      const code = generateHTSL(nodes, edges);
      setHTSLCode(code);
      debouncedSave(code);
    }
  }, [nodes, edges, debouncedSave, housingLoading, isSaving, syncMode]);

  // Handle code changes from code editor
  const handleCodeChange = (newCode) => {
    setHTSLCode(newCode);
    setSyncMode("code");
    
    // Only try to parse if there's actual code content
    if (newCode && newCode.trim() && !newCode.trim().startsWith('//')) {
      try {
        // Parse code to nodes
        const { nodes: parsedNodes, edges: parsedEdges } = parseHTSLToNodes(newCode);
        // Only update if parsing succeeds and returns valid nodes
        if (parsedNodes && parsedEdges && parsedNodes.length >= 0) {
          setNodes(parsedNodes);
          setEdges(parsedEdges);
        }
      } catch (error) {
        console.error("Parse error:", error);
        // Keep existing nodes if parsing fails - don't clear them
      }
    } else if (newCode.trim() === '' || newCode.trim().startsWith('//')) {
      // Only clear nodes if the code is actually empty or just comments
      setNodes([]);
      setEdges([]);
    }

    // Save with current node structure and new code
    debouncedSave(newCode);
  };

  const onConnect = useCallback(
    (connection) => {
      // Basic validation
      if (!connection.source || !connection.target) {
        console.warn('Invalid connection:', connection);
        return;
      }

      // Get source and target nodes
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);

      if (!sourceNode || !targetNode) {
        console.warn('Source or target node not found:', connection);
        return;
      }

      // Check for duplicate connections
      const duplicateEdge = edges.find(
        edge => edge.source === connection.source && 
                edge.target === connection.target &&
                edge.sourceHandle === connection.sourceHandle
      );
      
      if (duplicateEdge) {
        console.warn('Duplicate connection not allowed:', connection);
        return;
      }

      // Allow the connection and let ReactFlow handle the validation
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges, nodes, edges]
  );

  const addNode = useCallback(
    (type) => {
      const newNodeId = `${type}_${nodeIdRef.current++}`;
      let nodeData = { onUpdate: (data) => updateNodeData(newNodeId, data) };

      if (type === "event") {
        nodeData.eventType = "join";
      } else if (type === "action") {
        nodeData.actionType = "SendMessage";
        nodeData.message = "Welcome!";
      } else if (type === "condition") {
        nodeData.conditionType = "StatCheck";
        nodeData.statName = "coins";
        nodeData.operator = ">=";
        nodeData.compareValue = 10;
      }

      // Calculate better positioning
      const baseX = 100;
      const baseY = 100;
      const xOffset = 250;
      const yOffset = 150;
      
      const existingNodesOfType = nodes.filter(n => n.type === type).length;
      const position = { 
        x: baseX + (existingNodesOfType * xOffset), 
        y: baseY + (existingNodesOfType % 3) * yOffset 
      };

      const newNode = {
        id: newNodeId,
        data: nodeData,
        position,
        type: type,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, nodes]
  );

  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // Preserve the onUpdate callback
            const existingOnUpdate = node.data.onUpdate;
            return { 
              ...node, 
              data: { 
                ...node.data, 
                ...newData,
                onUpdate: existingOnUpdate // Ensure callback is preserved
              } 
            };
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

// Connection validation function
function isValidConnection(sourceNode, targetNode, connection) {
  // Prevent self-connections
  if (sourceNode.id === targetNode.id) {
    return false;
  }

  // Prevent duplicate connections
  // This will be checked at the edge level

  // Event nodes can only connect to actions or conditions (output only)
  if (sourceNode.type === 'event') {
    return targetNode.type === 'action' || targetNode.type === 'condition';
  }

  // Action nodes can connect to other actions or conditions
  if (sourceNode.type === 'action') {
    return targetNode.type === 'action' || targetNode.type === 'condition';
  }

  // Condition nodes have special rules
  if (sourceNode.type === 'condition') {
    // Conditions can connect to actions or other conditions
    if (targetNode.type === 'action' || targetNode.type === 'condition') {
      return true;
    }
  }

  return false;
}

const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  // Show access error if any
  if (accessError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-lg shadow-2xl border border-slate-700 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">🔒 Access Denied</h1>
          <p className="text-slate-400 mb-6">{accessError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleBackToDashboard}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded transition"
            >
              Dashboard
            </button>
            <a 
              href="/login" 
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

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
            connectionLineStyle={{ stroke: '#818cf8', strokeWidth: 3 }}
            connectionLineType="smoothstep"
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            minZoom={0.1}
            maxZoom={2}
            snapToGrid={true}
            snapGrid={[20, 20]}
            onPaneClick={() => {}}
            onNodeClick={() => {}}
            isValidConnection={(connection) => {
              const sourceNode = nodes.find(n => n.id === connection.source);
              const targetNode = nodes.find(n => n.id === connection.target);
              
              if (!sourceNode || !targetNode) return false;
              if (sourceNode.id === targetNode.id) return false;
              
              // Event nodes can only connect to actions or conditions
              if (sourceNode.type === 'event') {
                return targetNode.type === 'action' || targetNode.type === 'condition';
              }
              
              // Action nodes can connect to other actions or conditions
              if (sourceNode.type === 'action') {
                return targetNode.type === 'action' || targetNode.type === 'condition';
              }
              
              // Condition nodes can connect to actions or other conditions
              if (sourceNode.type === 'condition') {
                return targetNode.type === 'action' || targetNode.type === 'condition';
              }
              
              return false;
            }}
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
