import React, { memo } from "react";
import { Handle, Position } from "reactflow";

/**
 * Condition Node - Decision points in HTSL execution
 * Supports: StatCheck, ItemCheck, TimeCheck
 * Has two output paths: "True" and "False"
 */
const ConditionNode = memo(({ data, isConnecting }) => {
  const conditionTypes = ["StatCheck", "ItemCheck", "TimeCheck"];

  const conditionType = data.conditionType || "StatCheck";
  const operators = [">=", "<=", "==", "!=", ">", "<"];

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white border-2 border-purple-700 min-w-[180px]">
      <div className="font-bold text-sm mb-2">🔀 Condition</div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="w-3 h-3"
      />

      {/* Condition Type Selector */}
      <div className="mb-3">
        <label className="text-xs font-semibold block mb-1">Type:</label>
        <select
          value={conditionType}
          onChange={(e) =>
            data.onUpdate?.({ ...data, conditionType: e.target.value })
          }
          className="w-full px-2 py-1 text-xs bg-purple-700 text-white rounded border border-purple-400 focus:outline-none"
        >
          {conditionTypes.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic fields based on condition type */}
      {conditionType === "StatCheck" && (
        <>
          <div className="mb-2">
            <label className="text-xs font-semibold block mb-1">Stat:</label>
            <input
              type="text"
              value={data.statName || "coins"}
              onChange={(e) =>
                data.onUpdate?.({ ...data, statName: e.target.value })
              }
              placeholder="e.g., coins"
              className="w-full px-2 py-1 text-xs bg-purple-700 text-white rounded border border-purple-400 placeholder-purple-300 focus:outline-none"
            />
          </div>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Op:</label>
              <select
                value={data.operator || ">="}
                onChange={(e) =>
                  data.onUpdate?.({ ...data, operator: e.target.value })
                }
                className="w-full px-2 py-1 text-xs bg-purple-700 text-white rounded border border-purple-400 focus:outline-none"
              >
                {operators.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Value:</label>
              <input
                type="number"
                value={data.compareValue || 10}
                onChange={(e) =>
                  data.onUpdate?.({
                    ...data,
                    compareValue: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full px-2 py-1 text-xs bg-purple-700 text-white rounded border border-purple-400 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      {conditionType === "ItemCheck" && (
        <>
          <div className="mb-2">
            <label className="text-xs font-semibold block mb-1">Item:</label>
            <input
              type="text"
              value={data.itemName || ""}
              onChange={(e) =>
                data.onUpdate?.({ ...data, itemName: e.target.value })
              }
              placeholder="e.g., Diamond"
              className="w-full px-2 py-1 text-xs bg-purple-700 text-white rounded border border-purple-400 placeholder-purple-300 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold block mb-1">Min Qty:</label>
            <input
              type="number"
              value={data.minQuantity || 1}
              onChange={(e) =>
                data.onUpdate?.({
                  ...data,
                  minQuantity: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-2 py-1 text-xs bg-purple-700 text-white rounded border border-purple-400 focus:outline-none"
            />
          </div>
        </>
      )}

      {conditionType === "TimeCheck" && (
        <>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Hour:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={data.hour || 12}
                onChange={(e) =>
                  data.onUpdate?.({
                    ...data,
                    hour: parseInt(e.target.value) || 12,
                  })
                }
                className="w-full px-2 py-1 text-xs bg-purple-700 text-white rounded border border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Min:</label>
              <input
                type="number"
                min="0"
                max="59"
                value={data.minute || 0}
                onChange={(e) =>
                  data.onUpdate?.({
                    ...data,
                    minute: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-2 py-1 text-xs bg-purple-700 text-white rounded border border-purple-400 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      {/* True path handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        isConnectable={true}
        style={{ left: "33%", background: "#10b981" }}
        className="w-3 h-3"
      />

      {/* False path handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        isConnectable={true}
        style={{ left: "66%", background: "#ef4444" }}
        className="w-3 h-3"
      />

      {/* Labels for handles */}
      <div className="flex justify-between text-xs mt-1 px-1">
        <span className="text-green-200">✓ True</span>
        <span className="text-red-200">✗ False</span>
      </div>
    </div>
  );
});

ConditionNode.displayName = "ConditionNode";

export default ConditionNode;
