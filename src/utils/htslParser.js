/**
 * HTSL Parser - Converts between HTSL code and node graph
 * Enables two-way sync between visual editor and code editor
 */

/**
 * Parse HTSL code into nodes and edges
 * @param {string} code - HTSL code string
 * @returns {object} { nodes, edges }
 */
export function parseHTSLToNodes(code) {
  const nodes = [];
  const edges = [];
  let nodeIdCounter = 0;

  if (!code || code.trim().length === 0) {
    return { nodes: [], edges: [] };
  }

  try {
    // Find all on_event blocks
    const eventRegex = /on_event\s+"([^"]+)"\s+\{([\s\S]*?)\n\}/g;
    let eventMatch;

    while ((eventMatch = eventRegex.exec(code)) !== null) {
      const eventType = eventMatch[1];
      const eventBody = eventMatch[2];
      const eventId = `event_${nodeIdCounter++}`;

      // Create event node
      nodes.push({
        id: eventId,
        type: "event",
        data: { eventType, onUpdate: () => {} },
        position: { x: 100, y: 100 },
      });

      // Parse the event body for actions and conditions
      const { bodyNodes, bodyEdges, lastNodeId } = parseEventBody(
        eventBody,
        eventId,
        nodeIdCounter
      );

      nodes.push(...bodyNodes);
      edges.push(...bodyEdges);
      nodeIdCounter = parseInt(lastNodeId.split("_")[1]) + 1;
    }

    return { nodes, edges };
  } catch (error) {
    console.error("Parser error:", error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Parse the body of an event block
 */
function parseEventBody(body, parentId, startNodeId) {
  const nodes = [];
  const edges = [];
  let nodeIdCounter = startNodeId;
  let lastNodeId = parentId;

  // Split by lines, handling nested blocks
  const lines = body.split("\n").map((line) => line.trim());
  const stack = []; // For tracking if/else blocks

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("send_message")) {
      const nodeId = `action_${nodeIdCounter++}`;
      const messageMatch = line.match(/send_message\s+"([^"]*)"/);
      const message = messageMatch ? messageMatch[1] : "";

      nodes.push({
        id: nodeId,
        type: "action",
        data: {
          actionType: "SendMessage",
          message,
          onUpdate: () => {},
        },
        position: { x: 200, y: 100 + nodes.length * 100 },
      });

      edges.push({ source: lastNodeId, target: nodeId });
      lastNodeId = nodeId;
    } else if (line.startsWith("give_item")) {
      const nodeId = `action_${nodeIdCounter++}`;
      const match = line.match(/give_item\s+"([^"]*)"\s+(\d+)/);
      const [, itemName, count] = match || ["", "", "1"];

      nodes.push({
        id: nodeId,
        type: "action",
        data: {
          actionType: "GiveItem",
          itemName,
          itemCount: parseInt(count),
          onUpdate: () => {},
        },
        position: { x: 200, y: 100 + nodes.length * 100 },
      });

      edges.push({ source: lastNodeId, target: nodeId });
      lastNodeId = nodeId;
    } else if (line.startsWith("teleport")) {
      const nodeId = `action_${nodeIdCounter++}`;
      const match = line.match(/teleport\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/);
      const [, x, y, z] = match || ["", "0", "0", "0"];

      nodes.push({
        id: nodeId,
        type: "action",
        data: {
          actionType: "Teleport",
          x: parseFloat(x),
          y: parseFloat(y),
          z: parseFloat(z),
          onUpdate: () => {},
        },
        position: { x: 200, y: 100 + nodes.length * 100 },
      });

      edges.push({ source: lastNodeId, target: nodeId });
      lastNodeId = nodeId;
    } else if (line.startsWith("set_stat")) {
      const nodeId = `action_${nodeIdCounter++}`;
      const match = line.match(/set_stat\s+"([^"]*)"\s+(\d+)/);
      const [, statName, value] = match || ["", "", "0"];

      nodes.push({
        id: nodeId,
        type: "action",
        data: {
          actionType: "SetStat",
          statName,
          statValue: parseInt(value),
          onUpdate: () => {},
        },
        position: { x: 200, y: 100 + nodes.length * 100 },
      });

      edges.push({ source: lastNodeId, target: nodeId });
      lastNodeId = nodeId;
    } else if (line.startsWith("play_sound")) {
      const nodeId = `action_${nodeIdCounter++}`;
      const match = line.match(/play_sound\s+"([^"]*)"/);
      const sound = match ? match[1] : "";

      nodes.push({
        id: nodeId,
        type: "action",
        data: {
          actionType: "PlaySound",
          soundName: sound,
          onUpdate: () => {},
        },
        position: { x: 200, y: 100 + nodes.length * 100 },
      });

      edges.push({ source: lastNodeId, target: nodeId });
      lastNodeId = nodeId;
    } else if (line.startsWith("if")) {
      const nodeId = `condition_${nodeIdCounter++}`;

      // Extract condition
      const conditionMatch = line.match(/if\s+\((.*?)\)\s+\{/);
      const conditionExpr = conditionMatch ? conditionMatch[1] : "";
      const conditionData = parseCondition(conditionExpr);

      nodes.push({
        id: nodeId,
        type: "condition",
        data: { ...conditionData, onUpdate: () => {} },
        position: { x: 200, y: 100 + nodes.length * 100 },
      });

      edges.push({ source: lastNodeId, target: nodeId });

      // Parse if block body
      i++;
      let ifBlockBody = [];
      let braceCount = 1;

      while (i < lines.length && braceCount > 0) {
        const blockLine = lines[i];
        if (blockLine.includes("{")) braceCount++;
        if (blockLine.includes("}")) braceCount--;
        if (braceCount > 0) {
          ifBlockBody.push(blockLine);
        }
        i++;
      }

      // Check for else
      let hasElse = false;
      if (i < lines.length && lines[i].trim().startsWith("else")) {
        hasElse = true;
        i++; // Skip "else {"

        // Parse else block
        let elseBlockBody = [];
        braceCount = 1;
        i++; // Skip the {

        while (i < lines.length && braceCount > 0) {
          const blockLine = lines[i];
          if (blockLine.includes("{")) braceCount++;
          if (blockLine.includes("}")) braceCount--;
          if (braceCount > 0) {
            elseBlockBody.push(blockLine);
          }
          i++;
        }

        // Parse else block actions
        const elseNodeBody = ifBlockBody.join("\n");
        const { bodyNodes: elseNodes, bodyEdges: elseEdges, lastNodeId: elseLastId } = parseEventBody(
          elseNodeBody,
          nodeId,
          nodeIdCounter
        );
        nodes.push(...elseNodes);
        edges.push(
          { source: nodeId, target: elseNodes[0]?.id || nodeId, sourceHandle: "false" },
          ...elseEdges
        );
        nodeIdCounter = parseInt(elseLastId.split("_")[1]) + 1;
        lastNodeId = elseLastId;
      } else {
        // Parse if block actions
        const ifNodeBody = ifBlockBody.join("\n");
        if (ifNodeBody.trim().length > 0) {
          const { bodyNodes: ifNodes, bodyEdges: ifEdges, lastNodeId: ifLastId } = parseEventBody(
            ifNodeBody,
            nodeId,
            nodeIdCounter
          );
          nodes.push(...ifNodes);
          edges.push(
            { source: nodeId, target: ifNodes[0]?.id || nodeId, sourceHandle: "true" },
            ...ifEdges
          );
          nodeIdCounter = parseInt(ifLastId.split("_")[1]) + 1;
          lastNodeId = ifLastId;
        }
      }

      i--; // Adjust counter
    }
  }

  return { bodyNodes: nodes, bodyEdges: edges, lastNodeId };
}

/**
 * Parse condition expression
 */
function parseCondition(expr) {
  // StatCheck: stat "coins" >= 10
  const statMatch = expr.match(/stat\s+"([^"]*)"\s+(>=|<=|==|!=|>|<)\s+(\d+)/);
  if (statMatch) {
    return {
      conditionType: "StatCheck",
      statName: statMatch[1],
      operator: statMatch[2],
      compareValue: parseInt(statMatch[3]),
    };
  }

  // ItemCheck: item_count "Diamond" >= 1
  const itemMatch = expr.match(/item_count\s+"([^"]*)"\s+>=\s+(\d+)/);
  if (itemMatch) {
    return {
      conditionType: "ItemCheck",
      itemName: itemMatch[1],
      minQuantity: parseInt(itemMatch[2]),
    };
  }

  // Default
  return {
    conditionType: "StatCheck",
    statName: "coins",
    operator: ">=",
    compareValue: 10,
  };
}
