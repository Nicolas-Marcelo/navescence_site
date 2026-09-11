import type { NodeId } from "../config/nodes.js";

export const topics = {
  presence: "navescence/presenca/",
  status: "navescence/status/",
  scan: "navescence/scan/",
  command: "navescence/comando/"
};

export const subscriptions = [
  `${topics.presence}#`,
  `${topics.status}#`,
  `${topics.scan}#`
];

export function getCommandTopic(nodeId: NodeId) {
  return `${topics.command}${nodeId}`;
}