// =============================================================================
// BPMN XML Parser
// =============================================================================
// This module is the heart of the "Auto-App Generation" feature.
// It reads a BPMN 2.0 XML string and extracts:
//   - BPMN Elements: startEvent, endEvent, userTask, exclusiveGateway, parallelGateway
//   - Sequence Flows: the directed edges between elements
//
// The parsed data is then used to:
//   1. Persist the workflow structure to the database (WorkflowNode + SequenceFlow).
//   2. Automatically create FormSchema entries for every UserTask.
//   3. Enable the engine to route workflow instances through gateways.
//
// Library used: xml2js (parseStringPromise) — converts XML → plain JS object.
// =============================================================================

import { parseStringPromise } from "xml2js";
import { NodeType, FieldType } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types returned by the parser
// ---------------------------------------------------------------------------

export interface ParsedBpmnNode {
  bpmnId: string;
  name: string;
  type: NodeType;
  documentation?: string;
  position: number;
  /** For UserTask: auto-generated form fields based on name heuristics */
  autoFormFields?: Array<{
    fieldKey: string;
    label: string;
    type: FieldType;
    isRequired: boolean;
    position: number;
  }>;
}

export interface ParsedSequenceFlow {
  bpmnId: string;
  name?: string;
  sourceRef: string;
  targetRef: string;
  conditionExpression?: string;
  /** Derived from conditionExpression or flow name */
  conditionKey?: string;
  conditionValue?: string;
}

export interface ParsedBpmn {
  processName: string;
  nodes: ParsedBpmnNode[];
  sequenceFlows: ParsedSequenceFlow[];
}

// ---------------------------------------------------------------------------
// Helper: normalize xml2js array quirk
// xml2js wraps every element in an array, even when there is only one.
// ---------------------------------------------------------------------------
function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

// ---------------------------------------------------------------------------
// Helper: extract text from xml2js value (can be string | { _ } | undefined)
// ---------------------------------------------------------------------------
function getText(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (typeof val === "object" && val !== null && "_" in val) {
    return String((val as Record<string, unknown>)._).trim();
  }
  return String(val).trim();
}

// ---------------------------------------------------------------------------
// Helper: derive conditionKey/conditionValue from a BPMN condition expression
// Supports simple expressions like "${approved == true}" or "${decision == 'rejected'}"
// Also falls back to the flow name (e.g. "Approved", "Rejected").
// ---------------------------------------------------------------------------
function parseCondition(
  conditionExpr?: string,
  flowName?: string
): { conditionKey?: string; conditionValue?: string } {
  if (conditionExpr) {
    // Try to match ${someKey == 'someValue'} or ${someKey == true}
    const match = conditionExpr.match(
      /\$\{(\w+)\s*==\s*['"]?([^'"}\s]+)['"]?\}/
    );
    if (match) {
      return { conditionKey: match[1], conditionValue: match[2] };
    }
  }
  // Fall back: use flow name as conditionValue, "decision" as conditionKey
  if (flowName) {
    return {
      conditionKey: "decision",
      conditionValue: flowName.toLowerCase().replace(/\s+/g, "_"),
    };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Helper: auto-generate form fields for a UserTask based on its name
// This is a heuristic — a real implementation would read BPMN extensions.
// ---------------------------------------------------------------------------
function generateFormFields(
  taskName: string
): ParsedBpmnNode["autoFormFields"] {
  const lower = taskName.toLowerCase();
  const fields: ParsedBpmnNode["autoFormFields"] = [];

  // Every task gets a Notes field
  fields.push({
    fieldKey: "notes",
    label: "Notes / Comments",
    type: FieldType.TEXTAREA,
    isRequired: false,
    position: 99,
  });

  // Approval tasks get an Approval field
  if (
    lower.includes("approv") ||
    lower.includes("review") ||
    lower.includes("verif") ||
    lower.includes("check")
  ) {
    fields.unshift({
      fieldKey: "decision",
      label: "Decision",
      type: FieldType.APPROVAL,
      isRequired: true,
      position: 0,
    });
  }

  // Document / upload tasks
  if (
    lower.includes("upload") ||
    lower.includes("dokumen") ||
    lower.includes("document") ||
    lower.includes("attach")
  ) {
    fields.unshift({
      fieldKey: "attachment",
      label: "Attachment / Document",
      type: FieldType.FILE,
      isRequired: true,
      position: 0,
    });
  }

  // Date tasks
  if (lower.includes("tanggal") || lower.includes("date")) {
    fields.unshift({
      fieldKey: "date",
      label: "Date",
      type: FieldType.DATE,
      isRequired: true,
      position: 0,
    });
  }

  // Default: description field for general tasks
  if (fields.filter((f) => f.type !== FieldType.TEXTAREA).length === 0) {
    fields.unshift({
      fieldKey: "description",
      label: "Description",
      type: FieldType.TEXT,
      isRequired: true,
      position: 0,
    });
  }

  return fields;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * parseBpmnXml — converts a BPMN 2.0 XML string into structured data.
 *
 * Parsing strategy:
 *  1. Use xml2js to convert the XML into a JavaScript object.
 *  2. Navigate to the <process> element inside the root <definitions>.
 *  3. Iterate over each supported element type and build ParsedBpmnNode[].
 *  4. Iterate over <sequenceFlow> elements and build ParsedSequenceFlow[].
 *  5. For each USER_TASK node, auto-generate form fields.
 */
export async function parseBpmnXml(xmlString: string): Promise<ParsedBpmn> {
  // Parse the XML string. explicitArray:false means single elements won't be
  // wrapped in an array — but we still normalise with toArray() to be safe.
  const parsed = await parseStringPromise(xmlString, {
    explicitArray: true,
    mergeAttrs: false,
    tagNameProcessors: [
      // Strip namespace prefixes (bpmn:, bpmn2:, semantic:, etc.)
      (name) => name.replace(/^[^:]+:/, ""),
    ],
  });

  // Locate the root definitions element
  const definitions =
    parsed["definitions"] || parsed[Object.keys(parsed)[0]];
  if (!definitions) {
    throw new Error("Invalid BPMN XML: missing <definitions> root element");
  }

  // Locate the process element
  const processes = toArray(definitions["process"]);
  if (processes.length === 0) {
    throw new Error("Invalid BPMN XML: no <process> element found");
  }
  const process = processes[0];
  const processName =
    getText(process.$?.name) || getText(process.$?.id) || "Untitled Process";

  const nodes: ParsedBpmnNode[] = [];
  const sequenceFlows: ParsedSequenceFlow[] = [];
  let positionCounter = 0;

  // ---------------------------------------------------------------------------
  // Helper to extract nodes of a given BPMN element type
  // ---------------------------------------------------------------------------
  function extractNodes(elementKey: string, nodeType: NodeType) {
    toArray(process[elementKey]).forEach((el: Record<string, unknown>) => {
      const attrs = (el.$ || {}) as Record<string, string>;
      const docElements = toArray(el["documentation"] as unknown[]);
      const docText = docElements
        .map((d) =>
          getText(
            typeof d === "object" && d !== null && "_" in d
              ? (d as Record<string, unknown>)._
              : d
          )
        )
        .join(" ");

      const node: ParsedBpmnNode = {
        bpmnId: attrs.id || `node_${positionCounter}`,
        name: attrs.name || nodeType.replace(/_/g, " "),
        type: nodeType,
        documentation: docText || undefined,
        position: positionCounter++,
      };

      if (nodeType === NodeType.USER_TASK) {
        node.autoFormFields = generateFormFields(node.name);
      }

      nodes.push(node);
    });
  }

  // Extract all supported BPMN element types
  extractNodes("startEvent", NodeType.START_EVENT);
  extractNodes("endEvent", NodeType.END_EVENT);
  extractNodes("userTask", NodeType.USER_TASK);
  extractNodes("serviceTask", NodeType.SERVICE_TASK);
  extractNodes("exclusiveGateway", NodeType.EXCLUSIVE_GATEWAY);
  extractNodes("parallelGateway", NodeType.PARALLEL_GATEWAY);
  extractNodes("intermediateThrowEvent", NodeType.INTERMEDIATE_EVENT);
  extractNodes("intermediateCatchEvent", NodeType.INTERMEDIATE_EVENT);

  // ---------------------------------------------------------------------------
  // Extract sequence flows
  // ---------------------------------------------------------------------------
  toArray(process["sequenceFlow"]).forEach(
    (sf: Record<string, unknown>) => {
      const attrs = (sf.$ || {}) as Record<string, string>;
      const conditionEl = toArray(
        sf["conditionExpression"] as unknown[]
      )[0];
      const conditionExpr = conditionEl ? getText(conditionEl) : undefined;
      const flowName = attrs.name || undefined;
      const { conditionKey, conditionValue } = parseCondition(
        conditionExpr,
        flowName
      );

      sequenceFlows.push({
        bpmnId: attrs.id || `flow_${sequenceFlows.length}`,
        name: flowName,
        sourceRef: attrs.sourceRef,
        targetRef: attrs.targetRef,
        conditionExpression: conditionExpr,
        conditionKey,
        conditionValue,
      });
    }
  );

  return { processName, nodes, sequenceFlows };
}
