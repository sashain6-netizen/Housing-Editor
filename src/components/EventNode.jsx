import React, { memo } from "react";
import { Handle, Position } from "reactflow";

/**
 * Event Node - Starting points for HTSL execution
 * Represents triggers like PlayerJoin, PlayerKill, etc.
 */
const EventNode = memo(({ data, isConnecting }) => {
  const eventOptions = [
    "PlayerJoin",
    "PlayerKill",
    "PlayerDeath",
    "PlayerMove",
    "BlockClick",
  ];

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white border-2 border-blue-700 min-w-[160px]">
      <div className="font-bold text-sm mb-2">📌 Event</div>

      <div className="mb-3">
        <label className="text-xs font-semibold block mb-1">Trigger:</label>
        <select
          value={data.eventType || "PlayerJoin"}
          onChange={(e) =>
            data.onUpdate?.({ ...data, eventType: e.target.value })
          }
          className="w-full px-2 py-1 text-xs bg-blue-700 text-white rounded border border-blue-400 focus:outline-none"
        >
          {eventOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Output handle - connects to actions */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3"
      />
    </div>
  );
});

EventNode.displayName = "EventNode";

export default EventNode;
