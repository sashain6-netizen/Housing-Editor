import React, { memo, useCallback, useState } from "react";
import { Handle, Position } from "reactflow";

/**
 * Condition Node - Decision points in HTSL execution
 * Orange themed - Unreal Blueprint style
 * Supports: StatCheck, ItemCheck, TimeCheck
 * Two output paths: True (green) and False (red)
 */
const ConditionNode = memo(({ data, isConnecting }) => {
  const conditionTypes = ["StatCheck", "ItemCheck", "TimeCheck"];
  const operators = [">=", "<=", "==", "!=", ">", "<"];
  const [localConditionType, setLocalConditionType] = useState(data.conditionType || "StatCheck");

  const handleConditionTypeChange = useCallback((e) => {
    const newConditionType = e.target.value;
    setLocalConditionType(newConditionType);
    data.onUpdate?.({ ...data, conditionType: newConditionType });
  }, [data]);

  const handleFieldChange = useCallback((field, value) => {
    data.onUpdate?.({ ...data, [field]: value });
  }, [data]);

  // Sync local state with prop changes
  React.useEffect(() => {
    if (data.conditionType !== localConditionType) {
      setLocalConditionType(data.conditionType || "StatCheck");
    }
  }, [data.conditionType, localConditionType]);

  return (
    <div className="node-condition p-0 rounded-lg min-w-[240px] shadow-xl">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="bg-orange-400 border-2 border-orange-900"
      />

      {/* Header */}
      <div className="node-header">
        <span>🔀 Condition</span>
        <span className="text-xs opacity-70">{localConditionType}</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Condition Type Selector */}
        <div>
          <label className="text-xs font-semibold block mb-2 text-yellow-300 uppercase tracking-wide">
            Condition Type:
          </label>
          <select
            value={localConditionType}
            onChange={handleConditionTypeChange}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full px-3 py-2 text-xs bg-orange-900/30 text-yellow-100 rounded border border-orange-500/40 hover:border-orange-400/60 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-400/50 transition-colors"
          >
            {conditionTypes.map((opt) => (
              <option key={opt} value={opt} className="bg-orange-900">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* StatCheck Fields */}
        {localConditionType === "StatCheck" && (
          <>
            <div>
              <label className="text-xs font-semibold block mb-2 text-yellow-300 uppercase tracking-wide">
                Stat Name:
              </label>
              <input
                type="text"
                value={data.statName || "coins"}
                onChange={(e) => handleFieldChange("statName", e.target.value)}
                placeholder="e.g., coins, level"
                className="w-full px-3 py-2 text-xs bg-orange-900/30 text-yellow-100 rounded border border-orange-500/40 placeholder-orange-400/50 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-400/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-2 text-yellow-300 uppercase tracking-wide">
                  Operator:
                </label>
                <select
                  value={data.operator || ">="}
                  onChange={(e) => handleFieldChange("operator", e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 text-xs bg-orange-900/30 text-yellow-100 rounded border border-orange-500/40 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-400/50 transition-colors"
                >
                  {operators.map((op) => (
                    <option key={op} value={op} className="bg-orange-900">
                      {op}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-2 text-yellow-300 uppercase tracking-wide">
                  Value:
                </label>
                <input
                  type="number"
                  value={data.compareValue || 10}
                  onChange={(e) => handleFieldChange("compareValue", parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 text-xs bg-orange-900/30 text-yellow-100 rounded border border-orange-500/40 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-400/50 transition-colors"
                />
              </div>
            </div>
          </>
        )}

        {/* ItemCheck Fields */}
        {localConditionType === "ItemCheck" && (
          <>
            <div>
              <label className="text-xs font-semibold block mb-2 text-yellow-300 uppercase tracking-wide">
                Item Name:
              </label>
              <input
                type="text"
                value={data.itemName || ""}
                onChange={(e) => handleFieldChange("itemName", e.target.value)}
                placeholder="e.g., diamond"
                className="w-full px-3 py-2 text-xs bg-orange-900/30 text-yellow-100 rounded border border-orange-500/40 placeholder-orange-400/50 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2 text-yellow-300 uppercase tracking-wide">
                Min Quantity:
              </label>
              <input
                type="number"
                value={data.minQuantity || 1}
                onChange={(e) => handleFieldChange("minQuantity", Math.max(1, parseInt(e.target.value)) || 1)}
                min="1"
                className="w-full px-3 py-2 text-xs bg-orange-900/30 text-yellow-100 rounded border border-orange-500/40 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-400/50 transition-colors"
              />
            </div>
          </>
        )}

        {/* TimeCheck Fields */}
        {localConditionType === "TimeCheck" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-2 text-yellow-300 uppercase tracking-wide">
                Hour (0-23):
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={data.hour || 12}
                onChange={(e) => handleFieldChange("hour", parseInt(e.target.value) || 12)}
                className="w-full px-3 py-2 text-xs bg-orange-900/30 text-yellow-100 rounded border border-orange-500/40 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2 text-yellow-300 uppercase tracking-wide">
                Minute (0-59):
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={data.minute || 0}
                onChange={(e) => handleFieldChange("minute", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-orange-900/30 text-yellow-100 rounded border border-orange-500/40 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-400/50 transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Output handles - True/False paths */}
      <div className="flex justify-between px-4 py-2 border-t border-orange-500/20 text-xs font-semibold">
        <div className="flex items-center gap-1 text-green-400">
          <span>✓</span>
          <span>True</span>
        </div>
        <div className="flex items-center gap-1 text-red-400">
          <span>✗</span>
          <span>False</span>
        </div>
      </div>

      {/* True path handle (left) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "30%" }}
        className="bg-green-400 border-2 border-green-900"
      />

      {/* False path handle (right) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "70%" }}
        className="bg-red-400 border-2 border-red-900"
      />
    </div>
  );
});

ConditionNode.displayName = "ConditionNode";

export default ConditionNode;
