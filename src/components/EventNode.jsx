import React, { memo, useCallback, useState } from "react";
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

  const [localEventType, setLocalEventType] = useState(data.eventType || "join");

  const handleEventTypeChange = useCallback((e) => {
    const newEventType = e.target.value;
    setLocalEventType(newEventType);
    data.onUpdate?.({ ...data, eventType: newEventType });
  }, [data]);

  // Sync local state with prop changes
  React.useEffect(() => {
    if (data.eventType !== localEventType) {
      setLocalEventType(data.eventType || "join");
    }
  }, [data.eventType, localEventType]);

  return (
    <div className="node-event p-0 rounded-lg min-w-[200px] shadow-xl">
      {/* Header */}
      <div className="node-header">
        <span>⚡ Event</span>
        <span className="text-xs opacity-70">{localEventType}</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        <div>
          <label className="text-xs font-semibold block mb-2 text-purple-300 uppercase tracking-wide">
            Event Type:
          </label>
          <select
            value={localEventType}
            onChange={handleEventTypeChange}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
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
