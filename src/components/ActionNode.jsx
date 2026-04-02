import React, { memo, useState } from "react";
import { Handle, Position } from "reactflow";

/**
 * Action Node - Executable commands in the Housing script
 * Examples: SendMessage, GiveItem, Teleport, SetStat, PlaySound, etc.
 */
const ActionNode = memo(({ data, isConnecting }) => {
  const actionTypes = [
    "SendMessage",
    "GiveItem",
    "Teleport",
    "SetStat",
    "PlaySound",
    "Delay",
    "ClearInventory",
    "Kill",
  ];

  const actionType = data.actionType || "SendMessage";

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white border-2 border-green-700 min-w-[180px]">
      <div className="font-bold text-sm mb-2">⚙️ Action</div>

      {/* Input handle - from event or condition */}
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="w-3 h-3"
      />

      {/* Action Type Selector */}
      <div className="mb-3">
        <label className="text-xs font-semibold block mb-1">Type:</label>
        <select
          value={actionType}
          onChange={(e) =>
            data.onUpdate?.({ ...data, actionType: e.target.value })
          }
          className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
        >
          {actionTypes.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic input fields based on action type */}
      {actionType === "SendMessage" && (
        <div className="mb-3">
          <label className="text-xs font-semibold block mb-1">Message:</label>
          <input
            type="text"
            value={data.message || ""}
            onChange={(e) =>
              data.onUpdate?.({ ...data, message: e.target.value })
            }
            placeholder="Enter message"
            className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 placeholder-green-300 focus:outline-none"
          />
        </div>
      )}

      {actionType === "GiveItem" && (
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
              className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 placeholder-green-300 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold block mb-1">Count:</label>
            <input
              type="number"
              value={data.itemCount || 1}
              onChange={(e) =>
                data.onUpdate?.({
                  ...data,
                  itemCount: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
            />
          </div>
        </>
      )}

      {actionType === "Teleport" && (
        <>
          <div className="mb-2 gap-2 grid grid-cols-3">
            <div>
              <label className="text-xs font-semibold block mb-1">X:</label>
              <input
                type="number"
                value={data.x || 0}
                onChange={(e) =>
                  data.onUpdate?.({
                    ...data,
                    x: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Y:</label>
              <input
                type="number"
                value={data.y || 0}
                onChange={(e) =>
                  data.onUpdate?.({
                    ...data,
                    y: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Z:</label>
              <input
                type="number"
                value={data.z || 0}
                onChange={(e) =>
                  data.onUpdate?.({
                    ...data,
                    z: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      {actionType === "SetStat" && (
        <>
          <div className="mb-2">
            <label className="text-xs font-semibold block mb-1">Stat:</label>
            <input
              type="text"
              value={data.statName || ""}
              onChange={(e) =>
                data.onUpdate?.({ ...data, statName: e.target.value })
              }
              placeholder="e.g., coins"
              className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 placeholder-green-300 focus:outline-none"
            />
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold block mb-1">Value:</label>
            <input
              type="number"
              value={data.statValue || 0}
              onChange={(e) =>
                data.onUpdate?.({
                  ...data,
                  statValue: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
            />
          </div>
        </>
      )}

      {actionType === "PlaySound" && (
        <div className="mb-3">
          <label className="text-xs font-semibold block mb-1">Sound:</label>
          <input
            type="text"
            value={data.soundName || ""}
            onChange={(e) =>
              data.onUpdate?.({ ...data, soundName: e.target.value })
            }
            placeholder="e.g., block.note_block.pling"
            className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 placeholder-green-300 focus:outline-none"
          />
        </div>
      )}

      {actionType === "Delay" && (
        <div className="mb-3">
          <label className="text-xs font-semibold block mb-1">
            Delay (ms):
          </label>
          <input
            type="number"
            value={data.delayMs || 0}
            onChange={(e) =>
              data.onUpdate?.({
                ...data,
                delayMs: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-2 py-1 text-xs bg-green-700 text-white rounded border border-green-400 focus:outline-none"
          />
        </div>
      )}

      {/* Output handle - connects to next action or condition */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3"
      />
    </div>
  );
});

ActionNode.displayName = "ActionNode";

export default ActionNode;
