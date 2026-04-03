/**
 * HTSL Parser - Converts between HTSL code and node graph
 * Enables two-way sync between visual editor and code editor
 */

/**
 * Parse HTSL code into nodes and edges
 * @param {string} code - HTSL code string
 * @param {function} updateCallback - Callback for updating node data
 * @returns {object} { nodes, edges }
 */
export function parseHTSLToNodes(code, updateCallback) {
  const nodes = [];
  const edges = [];
  let nodeIdCounter = 0;

  if (!code || code.trim().length === 0) {
    return { nodes: [], edges: [] };
  }

  // Handle comments and empty lines
  const cleanedCode = code
    .split('\n')
    .filter(line => !line.trim().startsWith('//') && line.trim().length > 0)
    .join('\n');

  if (!cleanedCode || cleanedCode.trim().length === 0) {
    return { nodes: [], edges: [] };
  }

  try {
    // Find all on_event blocks
    const eventRegex = /on_event\s+"([^"]+)"\s+\{([\s\S]*?)\n\}/g;
    let eventMatch;

    while ((eventMatch = eventRegex.exec(cleanedCode)) !== null) {
      const eventType = eventMatch[1];
      const eventBody = eventMatch[2];
      const eventId = `event_${nodeIdCounter++}`;

      // Create event node with proper callback
      nodes.push({
        id: eventId,
        type: "event",
        data: { 
          eventType, 
          onUpdate: (data) => {
            if (updateCallback) {
              updateCallback(eventId, data);
            }
          }
        },
        position: { x: 100, y: 100 + nodes.length * 150 },
      });

      // Parse event body for actions and conditions
      try {
        const { bodyNodes, bodyEdges, lastNodeId } = parseEventBody(
          eventBody,
          eventId,
          nodeIdCounter,
          updateCallback
        );

        if (bodyNodes && bodyEdges) {
          nodes.push(...bodyNodes);
          edges.push(...bodyEdges);
          nodeIdCounter = parseInt(lastNodeId.split("_")[1]) + 1;
        }
      } catch (bodyError) {
        console.error("Error parsing event body:", bodyError);
        // Continue with other events even if one fails
      }
    }

    return { nodes, edges };
  } catch (error) {
    console.error("Parser error:", error);
    // Return empty state on error instead of crashing
    return { nodes: [], edges: [] };
  }
}

/**
 * Parse the body of an event block
 */
function parseEventBody(body, parentId, startNodeId, updateCallback) {
  const nodes = [];
  const edges = [];
  let nodeIdCounter = startNodeId;
  let lastNodeId = parentId;

  if (!body || body.trim().length === 0) {
    return { bodyNodes: nodes, bodyEdges: edges, lastNodeId };
  }

  try {
    // Split by lines, handling nested blocks
    const lines = body.split("\n").map((line) => line.trim()).filter(line => line.length > 0);
    const stack = []; // For tracking if/else blocks

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      try {
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
              onUpdate: (data) => {
                if (updateCallback) {
                  updateCallback(nodeId, data);
                }
              },
            },
            position: { x: 200 + (nodes.length % 3) * 150, y: 100 + Math.floor(nodes.length / 3) * 120 },
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
              itemCount: parseInt(count) || 1,
              onUpdate: (data) => {
                if (updateCallback) {
                  updateCallback(nodeId, data);
                }
              },
            },
            position: { x: 200 + (nodes.length % 3) * 150, y: 100 + Math.floor(nodes.length / 3) * 120 },
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
              x: parseFloat(x) || 0,
              y: parseFloat(y) || 0,
              z: parseFloat(z) || 0,
              onUpdate: (data) => {
                if (updateCallback) {
                  updateCallback(nodeId, data);
                }
              },
            },
            position: { x: 200 + (nodes.length % 3) * 150, y: 100 + Math.floor(nodes.length / 3) * 120 },
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
              statValue: parseInt(value) || 0,
              onUpdate: (data) => {
                if (updateCallback) {
                  updateCallback(nodeId, data);
                }
              },
            },
            position: { x: 200 + (nodes.length % 3) * 150, y: 100 + Math.floor(nodes.length / 3) * 120 },
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
              onUpdate: (data) => {
                if (updateCallback) {
                  updateCallback(nodeId, data);
                }
              },
            },
            position: { x: 200 + (nodes.length % 3) * 150, y: 100 + Math.floor(nodes.length / 3) * 120 },
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
            data: { 
              ...conditionData, 
              onUpdate: (data) => {
                if (updateCallback) {
                  updateCallback(nodeId, data);
                }
              }
            },
            position: { x: 200 + (nodes.length % 3) * 150, y: 100 + Math.floor(nodes.length / 3) * 120 },
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
            i++; // Skip {

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
            try {
              const elseNodeBody = elseBlockBody.join("\n");
              const { bodyNodes: elseNodes, bodyEdges: elseEdges, lastNodeId: elseLastId } = parseEventBody(
                elseNodeBody,
                nodeId,
                nodeIdCounter,
                updateCallback
              );
              if (elseNodes && elseEdges) {
                nodes.push(...elseNodes);
                edges.push(
                  { source: nodeId, target: elseNodes[0]?.id || nodeId, sourceHandle: "false" },
                  ...elseEdges
                );
                nodeIdCounter = parseInt(elseLastId.split("_")[1]) + 1;
                lastNodeId = elseLastId;
              }
            } catch (elseError) {
              console.error("Error parsing else block:", elseError);
            }
          } else {
            // Parse if block actions
            try {
              const ifNodeBody = ifBlockBody.join("\n");
              if (ifNodeBody.trim().length > 0) {
                const { bodyNodes: ifNodes, bodyEdges: ifEdges, lastNodeId: ifLastId } = parseEventBody(
                  ifNodeBody,
                  nodeId,
                  nodeIdCounter,
                  updateCallback
                );
                if (ifNodes && ifEdges) {
                  nodes.push(...ifNodes);
                  edges.push(
                    { source: nodeId, target: ifNodes[0]?.id || nodeId, sourceHandle: "true" },
                    ...ifEdges
                  );
                  nodeIdCounter = parseInt(ifLastId.split("_")[1]) + 1;
                  lastNodeId = ifLastId;
                }
              }
            } catch (ifError) {
              console.error("Error parsing if block:", ifError);
            }
          }

          i--; // Adjust counter
        }
      } catch (lineError) {
        console.error(`Error parsing line: ${line}`, lineError);
        // Continue with next line
      }
    }

    return { bodyNodes: nodes, bodyEdges: edges, lastNodeId };
  } catch (error) {
    console.error("Error in parseEventBody:", error);
    return { bodyNodes: [], bodyEdges: [], lastNodeId: parentId };
  }
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
