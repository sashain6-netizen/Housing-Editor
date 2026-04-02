import React, { memo } from "react";
import { Handle, Position } from "reactflow";

/**
 * Event Node - Starting points for HTSL execution
 * Represents triggers like PlayerJoin, PlayerKill, etc.
 * Purple/Magenta themed - Unreal Blueprint style
 */
const EventNode = memo(({ data, isConnecting }) => {
  const eventOptions = [
    "join",
    "quit",
    "block_break",
    "block_place",
    "kill",
    "death",
    "chat",
    "interact",
  ];

  return (
    <div className="node-event p-0 rounded-lg min-w-[200px] shadow-xl">
      {/* Header */}
      <div className="node-header">
        <span>⚡ Event</span>
        <span className="text-xs opacity-70">{data.eventType || "select"}</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        <div>
          <label className="text-xs font-semibold block mb-2 text-purple-300 uppercase tracking-wide">
            Event Type:
          </label>
          <select
            value={data.eventType || "join"}
            onChange={(e) =>
              data.onUpdate?.({ ...data, eventType: e.target.value })
            }
            className="w-full px-3 py-2 text-xs bg-purple-900/30 text-purple-100 rounded border border-purple-500/40 hover:border-purple-400/60 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-400/50 transition-colors"
          >
            {eventOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-purple-900">
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="bg-purple-400 border-2 border-purple-900"
      />
    </div>
  );
});

EventNode.displayName = "EventNode";

export default EventNode;
