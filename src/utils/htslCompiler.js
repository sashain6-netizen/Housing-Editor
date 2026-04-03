/**
 * HTSL Compiler - Generates Hypixel Housing HTSL code from a node graph
 * 
 * Handles three node types:
 * - Event: Starting points (triggers)
 * - Action: Commands to execute
 * - Condition: Decision points (if/else)
 * 
 * The compiler maintains a flat structure per Hypixel Housing constraints
 */

import { v4 as uuidv4 } from "uuid";

export function generateHTSL(nodes = [], edges = []) {
  if (!nodes.length) {
    return "// No nodes defined";
  }

  // Find all event nodes (they are starting points)
  const eventNodes = nodes.filter((node) => node.type === "event");

  if (eventNodes.length === 0) {
    return "// Error: No event node found. Start with an Event node.";
  }

  let htslCode = [];

  eventNodes.forEach((eventNode) => {
    const eventCode = traverseFromNode(
      eventNode.id,
      nodes,
      edges,
      new Set(),
      eventNode.data
    );
    htslCode.push(eventCode);
  });

  return htslCode.join("\n\n");
}

/**
 * Recursively traverse the node graph from a starting node
 * @param {string} nodeId - Current node ID
 * @param {array} nodes - All nodes in the graph
 * @param {array} edges - All edges in the graph
 * @param {Set} visited - Track visited nodes to prevent infinite loops
 * @param {object} nodeData - Data of the current node
 * @returns {string} Generated HTSL code segment
 */
function traverseFromNode(nodeId, nodes, edges, visited, nodeData) {
  // Prevent infinite loops
  if (visited.has(nodeId)) {
    return "";
  }
  visited.add(nodeId);

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return "";

  let code = [];

  // Handle based on node type
  if (node.type === "event") {
    const eventTrigger = getEventTrigger(node.data);
    code.push(eventTrigger);

    // Find outgoing connections
    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    const nextNodes = outgoingEdges.map((e) =>
      nodes.find((n) => n.id === e.target)
    );

    // Process connected nodes
    nextNodes.forEach((nextNode) => {
      if (nextNode) {
        const childCode = traverseFromNode(
          nextNode.id,
          nodes,
          edges,
          visited,
          nextNode.data
        );
        if (childCode) {
          code.push(childCode);
        }
      }
    });
  } else if (node.type === "action") {
    const actionCode = generateActionCode(node.data);
    code.push(actionCode);

    // Continue to next nodes
    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    const nextNodes = outgoingEdges.map((e) =>
      nodes.find((n) => n.id === e.target)
    );

    nextNodes.forEach((nextNode) => {
      if (nextNode) {
        const childCode = traverseFromNode(
          nextNode.id,
          nodes,
          edges,
          visited,
          nextNode.data
        );
        if (childCode) {
          code.push(childCode);
        }
      }
    });
  } else if (node.type === "condition") {
    const conditionCode = generateConditionCode(
      node.id,
      node.data,
      nodes,
      edges,
      visited
    );
    code.push(conditionCode);
  }

  return code.filter((c) => c).join("\n");
}

/**
 * Generate event trigger code
 * @param {object} data - Node data
 * @returns {string} Event trigger code
 */
function getEventTrigger(data) {
  const eventType = data.eventType || "join";
  const eventMap = {
    join: 'on_event "join" {',
    quit: 'on_event "quit" {',
    block_break: 'on_event "block_break" {',
    block_place: 'on_event "block_place" {',
    kill: 'on_event "kill" {',
    death: 'on_event "death" {',
    chat: 'on_event "chat" {',
    interact: 'on_event "interact" {',
  };

  return eventMap[eventType] || `on_event "${eventType}" {`;
}

/**
 * Generate action code
 * @param {object} data - Node data
 * @returns {string} Action code
 */
function generateActionCode(data) {
  const actionType = data.actionType || "SendMessage";

  switch (actionType) {
    case "SendMessage":
      const message = sanitizeString(data.message || "");
      return `  send_message "${message}"`;

    case "GiveItem":
      const itemName = sanitizeString(data.itemName || "");
      const itemCount = parseInt(data.itemCount || 1);
      return `  give_item "${itemName}" ${itemCount}`;

    case "Teleport":
      const x = parseFloat(data.x || 0);
      const y = parseFloat(data.y || 0);
      const z = parseFloat(data.z || 0);
      return `  teleport ${x} ${y} ${z}`;

    case "SetStat":
      const statName = sanitizeString(data.statName || "");
      const statValue = parseInt(data.statValue || 0);
      return `  set_stat "${statName}" ${statValue}`;

    case "PlaySound":
      const soundName = sanitizeString(data.soundName || "");
      return `  play_sound "${soundName}"`;

    case "Delay":
      const delayMs = parseInt(data.delayMs || 0);
      return `  delay ${delayMs}`;

    case "ClearInventory":
      return `  clear_inventory`;

    case "KillPlayer":
      return `  kill_player`;

    default:
      return `  // Unknown action: ${actionType}`;
  }
}

/**
 * Generate condition (if/else) code
 * @param {string} nodeId - Node ID
 * @param {object} data - Node data
 * @param {array} nodes - All nodes
 * @param {array} edges - All edges
 * @param {Set} visited - Visited nodes
 * @returns {string} Condition code block
 */
function generateConditionCode(nodeId, data, nodes, edges, visited) {
  const conditionType = data.conditionType || "StatCheck";
  let conditionExpr = "";

  switch (conditionType) {
    case "StatCheck":
      const statName = sanitizeString(data.statName || "coins");
      const operator = data.operator || ">=";
      const compareValue = parseInt(data.compareValue || 10);
      conditionExpr = `stat "${statName}" ${operator} ${compareValue}`;
      break;

    case "ItemCheck":
      const itemNameCheck = sanitizeString(data.itemName || "");
      const minQuantity = parseInt(data.minQuantity || 1);
      conditionExpr = `item_count "${itemNameCheck}" >= ${minQuantity}`;
      break;

    case "TimeCheck":
      const hour = parseInt(data.hour || 12);
      const minute = parseInt(data.minute || 0);
      conditionExpr = `current_time >= ${hour}:${minute}`;
      break;

    default:
      conditionExpr = `// Unknown condition: ${conditionType}`;
  }

  const code_parts = [];
  code_parts.push(`  if (${conditionExpr}) {`);

  // Find "True" path (default outgoing edge)
  const truePath = edges.filter(
    (e) => e.source === nodeId && e.sourceHandle === "true"
  );
  const trueNode = truePath.length > 0 ? nodes.find((n) => n.id === truePath[0].target) : null;

  if (trueNode) {
    const trueCode = traverseFromNode(trueNode.id, nodes, edges, visited, trueNode.data);
    if (trueCode) {
      trueCode.split("\n").forEach((line) => {
        code_parts.push(`    ${line}`);
      });
    }
  }

  code_parts.push(`  }`);

  // Find "False" path
  const falsePath = edges.filter(
    (e) => e.source === nodeId && e.sourceHandle === "false"
  );
  const falseNode = falsePath.length > 0 ? nodes.find((n) => n.id === falsePath[0].target) : null;

  if (falseNode) {
    code_parts.push(`  else {`);
    const falseCode = traverseFromNode(falseNode.id, nodes, edges, visited, falseNode.data);
    if (falseCode) {
      falseCode.split("\n").forEach((line) => {
        code_parts.push(`    ${line}`);
      });
    }
    code_parts.push(`  }`);
  }

  return code_parts.join("\n");
}

/**
 * Sanitize string values for HTSL output
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  return String(str).replace(/"/g, '\\"').trim();
}
