import React, { memo, useCallback } from "react";
import { Handle, Position } from "reactflow";

/**
 * Action Node - Executable commands in Housing script
 * Blue themed - Unreal Blueprint style
 * Supports: SendMessage, GiveItem, Teleport, SetStat, PlaySound, Delay, ClearInventory
 */
const ActionNode = memo(({ data, isConnecting }) => {
  const actionTypes = [
    "SendMessage",
    "GiveItem",
    "Teleport",
    "SetStat",
    "PlaySound",
    "Delay",
  ];

  const actionType = data.actionType || "SendMessage";

  const handleActionTypeChange = useCallback((e) => {
    const newActionType = e.target.value;
    data.onUpdate?.({ ...data, actionType: newActionType });
  }, [data]);

  const handleFieldChange = useCallback((field, value) => {
    data.onUpdate?.({ ...data, [field]: value });
  }, [data]);

  return (
    <div className="node-action p-0 rounded-lg min-w-[220px] shadow-xl">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="bg-blue-400 border-2 border-blue-900"
      />

      {/* Header */}
      <div className="node-header">
        <span>⚙️ Action</span>
        <span className="text-xs opacity-70">{actionType}</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Action Type Selector */}
        <div>
          <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase tracking-wide">
            Action Type:
          </label>
          <select
            value={actionType}
            onChange={handleActionTypeChange}
            className="w-full px-3 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 hover:border-blue-400/60 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {actionTypes.map((opt) => (
              <option key={opt} value={opt} className="bg-blue-900">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields */}
        {actionType === "SendMessage" && (
          <div>
            <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase tracking-wide">
              Message:
            </label>
            <input
              type="text"
              value={data.message || ""}
              onChange={(e) => handleFieldChange("message", e.target.value)}
              placeholder="Enter message text"
              className="w-full px-3 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 placeholder-blue-400/50 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
            />
          </div>
        )}

        {actionType === "GiveItem" && (
          <>
            <div>
              <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase tracking-wide">
                Item Name:
              </label>
              <input
                type="text"
                value={data.itemName || ""}
                onChange={(e) => handleFieldChange("itemName", e.target.value)}
                placeholder="e.g., diamond"
                className="w-full px-3 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 placeholder-blue-400/50 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase tracking-wide">
                Count:
              </label>
              <input
                type="number"
                value={data.itemCount || 1}
                onChange={(e) => handleFieldChange("itemCount", Math.max(1, parseInt(e.target.value)) || 1)}
                min="1"
                className="w-full px-3 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
              />
            </div>
          </>
        )}

        {actionType === "Teleport" && (
          <div className="grid grid-cols-3 gap-2">
            {["x", "y", "z"].map((coord) => (
              <div key={coord}>
                <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase">
                  {coord.toUpperCase()}:
                </label>
                <input
                  type="number"
                  value={data[coord] || 0}
                  onChange={(e) => handleFieldChange(coord, parseFloat(e.target.value) || 0)}
                  step="0.5"
                  className="w-full px-2 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {actionType === "SetStat" && (
          <>
            <div>
              <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase tracking-wide">
                Stat Name:
              </label>
              <input
                type="text"
                value={data.statName || ""}
                onChange={(e) => handleFieldChange("statName", e.target.value)}
                placeholder="e.g., coins"
                className="w-full px-3 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 placeholder-blue-400/50 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase tracking-wide">
                Value:
              </label>
              <input
                type="number"
                value={data.statValue || 0}
                onChange={(e) => handleFieldChange("statValue", parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
              />
            </div>
          </>
        )}

        {actionType === "PlaySound" && (
          <div>
            <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase tracking-wide">
              Sound ID:
            </label>
            <input
              type="text"
              value={data.soundName || ""}
              onChange={(e) => handleFieldChange("soundName", e.target.value)}
              placeholder="e.g., block.note_block"
              className="w-full px-3 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 placeholder-blue-400/50 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
            />
          </div>
        )}

        {actionType === "Delay" && (
          <div>
            <label className="text-xs font-semibold block mb-2 text-blue-300 uppercase tracking-wide">
              Delay (milliseconds):
            </label>
            <input
              type="number"
              value={data.delayMs || 100}
              onChange={(e) => handleFieldChange("delayMs", Math.max(0, parseInt(e.target.value)) || 100)}
              min="0"
              step="100"
              className="w-full px-3 py-2 text-xs bg-blue-900/30 text-blue-100 rounded border border-blue-500/40 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-400/50 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="bg-blue-400 border-2 border-blue-900"
      />
    </div>
  );
});

ActionNode.displayName = "ActionNode";

export default ActionNode;
