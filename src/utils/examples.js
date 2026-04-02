/**
 * HTSL Compiler Usage Examples
 * 
 * This file demonstrates how to use the generateHTSL function
 * with various node graphs to generate Hypixel Housing HTSL code.
 */

import { generateHTSL } from "./htslCompiler.js";

// ============================================
// Example 1: Simple Welcome Message
// ============================================

export function exampleWelcome() {
  const nodes = [
    {
      id: "event_1",
      type: "event",
      data: { eventType: "PlayerJoin" },
    },
    {
      id: "action_1",
      type: "action",
      data: { actionType: "SendMessage", message: "Welcome to my house!" },
    },
  ];

  const edges = [{ source: "event_1", target: "action_1" }];

  return generateHTSL(nodes, edges);
}

// ============================================
// Example 2: Reward System with Condition
// ============================================

export function exampleRewardSystem() {
  const nodes = [
    {
      id: "event_1",
      type: "event",
      data: { eventType: "PlayerJoin" },
    },
    {
      id: "action_1",
      type: "action",
      data: { actionType: "SendMessage", message: "Welcome back!" },
    },
    {
      id: "condition_1",
      type: "condition",
      data: {
        conditionType: "StatCheck",
        statName: "coins",
        operator: ">=",
        compareValue: 100,
      },
    },
    {
      id: "action_2",
      type: "action",
      data: {
        actionType: "SendMessage",
        message: "You have enough coins for a reward!",
      },
    },
    {
      id: "action_3",
      type: "action",
      data: { actionType: "GiveItem", itemName: "Diamond", itemCount: 5 },
    },
    {
      id: "action_4",
      type: "action",
      data: {
        actionType: "SendMessage",
        message: "You need more coins...",
      },
    },
  ];

  const edges = [
    { source: "event_1", target: "action_1" },
    { source: "action_1", target: "condition_1" },
    { source: "condition_1", target: "action_2", sourceHandle: "true" },
    { source: "action_2", target: "action_3" },
    { source: "condition_1", target: "action_4", sourceHandle: "false" },
  ];

  return generateHTSL(nodes, edges);
}

// ============================================
// Example 3: Teleport on Kill Event
// ============================================

export function exampleTeleportOnKill() {
  const nodes = [
    {
      id: "event_1",
      type: "event",
      data: { eventType: "PlayerKill" },
    },
    {
      id: "action_1",
      type: "action",
      data: {
        actionType: "SendMessage",
        message: "You've made a kill! Teleporting...",
      },
    },
    {
      id: "action_2",
      type: "action",
      data: {
        actionType: "PlaySound",
        soundName: "entity.player.levelup",
      },
    },
    {
      id: "action_3",
      type: "action",
      data: { actionType: "Teleport", x: 0, y: 64, z: 0 },
    },
    {
      id: "action_4",
      type: "action",
      data: {
        actionType: "SetStat",
        statName: "kills",
        statValue: 1,
      },
    },
  ];

  const edges = [
    { source: "event_1", target: "action_1" },
    { source: "action_1", target: "action_2" },
    { source: "action_2", target: "action_3" },
    { source: "action_3", target: "action_4" },
  ];

  return generateHTSL(nodes, edges);
}

// ============================================
// Example 4: Complex Decision Tree
// ============================================

export function exampleComplexLogic() {
  const nodes = [
    {
      id: "event_1",
      type: "event",
      data: { eventType: "BlockClick" },
    },
    {
      id: "action_1",
      type: "action",
      data: {
        actionType: "SendMessage",
        message: "Block clicked! Checking inventory...",
      },
    },
    {
      id: "condition_1",
      type: "condition",
      data: {
        conditionType: "ItemCheck",
        itemName: "Diamond",
        minQuantity: 1,
      },
    },
    {
      id: "action_2",
      type: "action",
      data: {
        actionType: "SendMessage",
        message: "Great! You have a diamond!",
      },
    },
    {
      id: "action_3",
      type: "action",
      data: { actionType: "GiveItem", itemName: "Emerald", itemCount: 3 },
    },
    {
      id: "action_4",
      type: "action",
      data: {
        actionType: "SendMessage",
        message: "Get a diamond first!",
      },
    },
    {
      id: "action_5",
      type: "action",
      data: { actionType: "PlaySound", soundName: "entity.enderman.teleport" },
    },
  ];

  const edges = [
    { source: "event_1", target: "action_1" },
    { source: "action_1", target: "condition_1" },
    { source: "condition_1", target: "action_2", sourceHandle: "true" },
    { source: "action_2", target: "action_3" },
    { source: "action_3", target: "action_5" },
    { source: "condition_1", target: "action_4", sourceHandle: "false" },
    { source: "action_4", target: "action_5" },
  ];

  return generateHTSL(nodes, edges);
}

// ============================================
// (Testing these examples)
// ============================================

if (typeof window === "undefined") {
  // Node.js environment - run examples
  console.log("=== Example 1: Welcome ===");
  console.log(exampleWelcome());
  console.log("\n=== Example 2: Reward System ===");
  console.log(exampleRewardSystem());
  console.log("\n=== Example 3: Teleport on Kill ===");
  console.log(exampleTeleportOnKill());
  console.log("\n=== Example 4: Complex Logic ===");
  console.log(exampleComplexLogic());
}
