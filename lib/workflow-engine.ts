// Workflow Engine - handles gateway routing and task advancement
"use server";

import { prisma } from "./prisma";
import { NodeType, InstanceStatus } from "@prisma/client";

type NodeWithFlows = {
  id: string;
  bpmnId: string;
  type: NodeType;
  name: string;
  outgoingFlows: Array<{
    conditionKey: string | null;
    conditionValue: string | null;
    name: string | null;
    targetNode: { id: string; bpmnId: string; type: NodeType; name: string };
  }>;
};

function resolveNextNodes(node: NodeWithFlows, data: Record<string, string>) {
  const { outgoingFlows, type } = node;
  if (type === NodeType.EXCLUSIVE_GATEWAY) {
    let defaultFlow: (typeof outgoingFlows)[0] | undefined;
    for (const flow of outgoingFlows) {
      if (!flow.conditionKey) { defaultFlow = flow; continue; }
      if (data[flow.conditionKey] === flow.conditionValue) return [flow.targetNode];
    }
    return defaultFlow ? [defaultFlow.targetNode] : outgoingFlows.length > 0 ? [outgoingFlows[0].targetNode] : [];
  }
  if (type === NodeType.PARALLEL_GATEWAY) return outgoingFlows.map(f => f.targetNode);
  return outgoingFlows.length > 0 ? [outgoingFlows[0].targetNode] : [];
}

export async function advanceWorkflow(instanceId: string, currentBpmnId: string, submittedData: Record<string, string> = {}) {
  const instance = await prisma.workflowInstance.findUniqueOrThrow({
    where: { id: instanceId },
    select: { id: true, workflowTemplateId: true, contextData: true },
  });

  const ctx = instance.contextData ? JSON.parse(instance.contextData) : {};
  const newCtx = { ...ctx, ...submittedData };

  const currentNode = await prisma.workflowNode.findFirstOrThrow({
    where: { workflowTemplateId: instance.workflowTemplateId, bpmnId: currentBpmnId },
    include: { outgoingFlows: { include: { targetNode: true } } },
  });

  if (currentNode.type === NodeType.END_EVENT) {
    await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: { status: InstanceStatus.COMPLETED, completedAt: new Date(), contextData: JSON.stringify(newCtx) },
    });
    return;
  }

  const nextNodes = resolveNextNodes(currentNode, submittedData);
  if (!nextNodes.length) {
    await prisma.workflowInstance.update({ where: { id: instanceId }, data: { status: InstanceStatus.ERROR, contextData: JSON.stringify(newCtx) } });
    return;
  }

  const nextNode = nextNodes[0];
  await prisma.workflowInstance.update({
    where: { id: instanceId },
    data: {
      currentNodeBpmnId: nextNode.bpmnId,
      contextData: JSON.stringify(newCtx),
      status: nextNode.type === NodeType.END_EVENT ? InstanceStatus.COMPLETED : InstanceStatus.IN_PROGRESS,
      completedAt: nextNode.type === NodeType.END_EVENT ? new Date() : undefined,
    },
  });

  if (nextNode.type === NodeType.USER_TASK) {
    await prisma.taskInstance.create({
      data: { workflowInstanceId: instanceId, workflowNodeId: nextNode.id, status: InstanceStatus.PENDING },
    });
    return;
  }

  if ([NodeType.EXCLUSIVE_GATEWAY, NodeType.PARALLEL_GATEWAY, NodeType.SERVICE_TASK].includes(nextNode.type)) {
    await advanceWorkflow(instanceId, nextNode.bpmnId, submittedData);
  }
}
