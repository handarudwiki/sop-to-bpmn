"use server";

// =============================================================================
// Server Actions — SOP to BPMN conversion + BPMN deployment + Workflow execution
// =============================================================================

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseBpmnXml } from "@/lib/bpmn-parser";
import { advanceWorkflow } from "@/lib/workflow-engine";
import { extractProcessFromSop } from "@/lib/gemini-sop";
import { FieldType, InstanceStatus, NodeType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Action 1: SOP → BPMN XML (AI-assisted generation)
// ---------------------------------------------------------------------------

/**
 * generateBpmnFromSop — takes plain SOP text and returns a BPMN 2.0 XML string.
 *
 * Uses Gemini 3.7 Flash (via the @google/genai SDK) to understand the SOP
 * and extract a structured, ordered list of workflow steps — handling numbered
 * lists, bullet points, or free-form prose in any language. We then build valid
 * BPMN 2.0 XML deterministically from those steps so the downstream parser and
 * workflow engine keep working unchanged.
 *
 * Each step becomes a userTask; consecutive steps are linked by sequenceFlows.
 * Steps the model flags as a decision get an exclusiveGateway with
 * Approved/Rejected branches.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateBpmnFromSop(
  _prevState: { xml: string; error: string } | null,
  formData: FormData
): Promise<{ xml: string; error: string }> {
  const sopText = formData.get("sopText") as string;
  const processName = (formData.get("processName") as string) || "SOP Process";

  if (!sopText?.trim()) return { xml: "", error: "SOP text is required." };

  // --- Extract structured steps (Gemini 3.7 Flash, or static-rule fallback
  // when no GEMINI_API_KEY is configured) ---
  let steps;
  try {
    const result = await extractProcessFromSop(sopText);
    steps = result.steps;
  } catch (err) {
    console.error("extractProcessFromSop error:", err);
    return {
      xml: "",
      error: err instanceof Error ? err.message : "SOP extraction failed.",
    };
  }

  // --- Build BPMN 2.0 XML from the extracted steps ---
  const pid = "Process_1";
  const startId = "Start_1";
  const endId = "End_1";

  const elements: string[] = [];
  const flows: string[] = [];
  let flowIdx = 0;

  const makeFlow = (src: string, tgt: string, name?: string, cond?: string) => {
    const fid = `Flow_${++flowIdx}`;
    const condEl = cond ? `<conditionExpression>${cond}</conditionExpression>` : "";
    flows.push(`<sequenceFlow id="${fid}" name="${escapeXml(name || "")}" sourceRef="${src}" targetRef="${tgt}">${condEl}</sequenceFlow>`);
    return fid;
  };

  elements.push(`<startEvent id="${startId}" name="Start"/>`);

  let prevId = startId;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const taskId = `Task_${i + 1}`;
    elements.push(`<userTask id="${taskId}" name="${escapeXml(step.name)}">`);
    elements.push(`  <documentation>${escapeXml(step.description || step.name)}</documentation>`);
    elements.push(`</userTask>`);
    makeFlow(prevId, taskId);

    if (step.isDecision) {
      const gwId = `Gateway_${i + 1}`;
      const rejEndId = `End_Rejected_${i + 1}`;
      elements.push(`<exclusiveGateway id="${gwId}" name="Approved?"/>`);
      elements.push(`<endEvent id="${rejEndId}" name="Rejected"/>`);
      makeFlow(taskId, gwId);
      makeFlow(gwId, i + 1 < steps.length ? `Task_${i + 2}` : endId, "Approved", `\${decision == 'approved'}`);
      makeFlow(gwId, rejEndId, "Rejected", `\${decision == 'rejected'}`);
      prevId = i + 1 < steps.length ? `Task_${i + 2}` : endId;
      i++; // skip next task since we already connected it
    } else {
      prevId = taskId;
    }
  }

  elements.push(`<endEvent id="${endId}" name="End"/>`);
  if (prevId !== endId && !flows.some(f => f.includes(`targetRef="${endId}"`))) {
    makeFlow(prevId, endId);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             targetNamespace="http://bpmn.io/schema/bpmn"
             id="Definitions_1">
  <process id="${pid}" name="${escapeXml(processName)}" isExecutable="true">
${elements.map(e => "    " + e).join("\n")}
${flows.map(f => "    " + f).join("\n")}
  </process>
</definitions>`;

  return { xml, error: "" };
}

// ---------------------------------------------------------------------------
// Action 2: Deploy BPMN XML → WorkflowTemplate in database
// ---------------------------------------------------------------------------

/**
 * deployBpmnXml — parses a BPMN XML string and persists the full workflow
 * structure (nodes + sequence flows + form schemas) to the database.
 * This is the "Auto-App Generation" core: after calling this, users can
 * immediately start instances of the workflow without any manual coding.
 */
export async function deployBpmnXml(
  _prevState: { templateId: string; error: string } | null,
  formData: FormData
): Promise<{ templateId: string; error: string }> {
  const bpmnXml = formData.get("bpmnXml") as string;
  const name = (formData.get("name") as string) || "Untitled Workflow";
  const description = formData.get("description") as string;

  if (!bpmnXml?.trim()) return { templateId: "", error: "BPMN XML is required." };

  try {
    const parsed = await parseBpmnXml(bpmnXml);

    // Create a URL-safe slug
    const baseSlug = parsed.processName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Date.now()}`;

    // Create WorkflowTemplate + all nodes + forms in a single transaction
    const template = await prisma.$transaction(async (tx) => {
      const tmpl = await tx.workflowTemplate.create({
        data: {
          name: name || parsed.processName,
          description,
          bpmnXml,
          slug,
          isDeployed: true,
        },
      });

      // Create WorkflowNode records
      const nodeIdMap: Record<string, string> = {}; // bpmnId → db id

      for (const n of parsed.nodes) {
        const node = await tx.workflowNode.create({
          data: {
            bpmnId: n.bpmnId,
            name: n.name,
            type: n.type,
            documentation: n.documentation,
            position: n.position,
            workflowTemplateId: tmpl.id,
          },
        });
        nodeIdMap[n.bpmnId] = node.id;

        // Auto-create FormSchema for USER_TASK nodes
        if (n.type === NodeType.USER_TASK && n.autoFormFields?.length) {
          await tx.formSchema.create({
            data: {
              title: `${n.name} Form`,
              workflowNodeId: node.id,
              fields: {
                create: n.autoFormFields.map((f) => ({
                  fieldKey: f.fieldKey,
                  label: f.label,
                  type: f.type as FieldType,
                  isRequired: f.isRequired,
                  position: f.position,
                })),
              },
            },
          });
        }
      }

      // Create SequenceFlow records
      for (const sf of parsed.sequenceFlows) {
        const sourceId = nodeIdMap[sf.sourceRef];
        const targetId = nodeIdMap[sf.targetRef];
        if (!sourceId || !targetId) continue;

        await tx.sequenceFlow.create({
          data: {
            bpmnId: sf.bpmnId,
            name: sf.name,
            conditionExpression: sf.conditionExpression,
            conditionKey: sf.conditionKey,
            conditionValue: sf.conditionValue,
            workflowTemplateId: tmpl.id,
            sourceNodeId: sourceId,
            targetNodeId: targetId,
          },
        });
      }

      return tmpl;
    });

    revalidatePath("/workflows");
    return { templateId: template.id, error: "" };
  } catch (err) {
    console.error("deployBpmnXml error:", err);
    return { templateId: "", error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Action 3: Start a new WorkflowInstance
// ---------------------------------------------------------------------------

export async function startWorkflowInstance(
  _prevState: { instanceId: string; error: string } | null,
  formData: FormData
): Promise<{ instanceId: string; error: string }> {
  const templateId = formData.get("templateId") as string;
  const title = (formData.get("title") as string) || "New Request";
  const initiatedBy = (formData.get("initiatedBy") as string) || "Anonymous";

  try {
    const template = await prisma.workflowTemplate.findUniqueOrThrow({
      where: { id: templateId },
      include: { nodes: { orderBy: { position: "asc" }, take: 1, where: { type: NodeType.START_EVENT } } },
    });

    if (!template.isDeployed) return { instanceId: "", error: "Workflow is not deployed yet." };

    const startNode = template.nodes[0];
    if (!startNode) return { instanceId: "", error: "No start event found in workflow." };

    // Create instance
    const instance = await prisma.workflowInstance.create({
      data: {
        title,
        initiatedBy,
        workflowTemplateId: templateId,
        currentNodeBpmnId: startNode.bpmnId,
        status: InstanceStatus.IN_PROGRESS,
      },
    });

    // Advance past the start event immediately
    await advanceWorkflow(instance.id, startNode.bpmnId, {});

    revalidatePath("/inbox");
    revalidatePath("/workflows");
    return { instanceId: instance.id, error: "" };
  } catch (err) {
    console.error("startWorkflowInstance error:", err);
    return { instanceId: "", error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Action 4: Complete a task (submit form data, advance workflow)
// ---------------------------------------------------------------------------

export async function completeTask(
  _prevState: { success: boolean; error: string } | null,
  formData: FormData
): Promise<{ success: boolean; error: string }> {
  const taskInstanceId = formData.get("taskInstanceId") as string;
  const decision = formData.get("decision") as string;
  const comments = formData.get("comments") as string;

  // Collect all dynamic form fields
  const submittedData: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (!["taskInstanceId", "comments"].includes(key)) {
      submittedData[key] = String(value);
    }
  }

  try {
    const task = await prisma.taskInstance.findUniqueOrThrow({
      where: { id: taskInstanceId },
      include: { workflowInstance: true, workflowNode: true },
    });

    if (task.status !== InstanceStatus.PENDING) {
      return { success: false, error: "Task is already completed." };
    }

    // Mark task as complete
    await prisma.taskInstance.update({
      where: { id: taskInstanceId },
      data: {
        status: decision === "rejected" ? InstanceStatus.REJECTED : InstanceStatus.COMPLETED,
        formData: JSON.stringify(submittedData),
        decision,
        comments,
        completedAt: new Date(),
      },
    });

    // Advance the workflow
    await advanceWorkflow(
      task.workflowInstanceId,
      task.workflowNode.bpmnId,
      submittedData
    );

    revalidatePath("/inbox");
    revalidatePath(`/instances/${task.workflowInstanceId}`);
    return { success: true, error: "" };
  } catch (err) {
    console.error("completeTask error:", err);
    return { success: false, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Action 5: Delete a workflow template
// ---------------------------------------------------------------------------

export async function deleteWorkflowTemplate(templateId: string) {
  await prisma.workflowTemplate.delete({ where: { id: templateId } });
  revalidatePath("/workflows");
  redirect("/workflows");
}
