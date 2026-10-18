"use client";

import { useActionState } from "react";
import { completeTask } from "@/app/actions";
import type { FieldType } from "@prisma/client";

type Field = {
  id: string;
  fieldKey: string;
  label: string;
  type: FieldType;
  isRequired: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  options?: string | null;
  defaultValue?: string | null;
};

type Task = {
  id: string;
  workflowNode: {
    name: string;
    formSchema?: { fields: Field[] } | null;
    outgoingFlows: Array<{ name: string | null; conditionValue: string | null; targetNode: { name: string } }>;
  };
};

const initial = { success: false, error: "" };

export function DynamicTaskForm({ task }: { task: Task }) {
  const [state, action, pending] = useActionState(completeTask, initial);
  const fields = task.workflowNode.formSchema?.fields ?? [];
  const hasApproval = fields.some(f => f.type === "APPROVAL");
  const outFlows = task.workflowNode.outgoingFlows;

  if (state.success) {
    return (
      <div className="glass-card p-8 text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold text-emerald-300">Task Submitted!</h2>
        <p className="text-white/50 text-sm">The workflow has been advanced to the next step.</p>
        <a href="/inbox" className="inline-block rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
          Back to Inbox
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="glass-card p-6 space-y-5">
      <input type="hidden" name="taskInstanceId" value={task.id} />

      {fields.length === 0 ? (
        <p className="text-white/50 text-sm italic py-4">No form fields for this task. Simply submit to complete it.</p>
      ) : (
        fields.map(field => {
          if (field.type === "APPROVAL") return null; // Rendered separately as action buttons
          return (
            <div key={field.id}>
              <label htmlFor={field.fieldKey} className="block text-sm font-medium text-white/70 mb-1.5">
                {field.label}
                {field.isRequired && <span className="ml-1 text-rose-400">*</span>}
              </label>
              {field.helpText && (
                <p className="text-xs text-white/35 mb-1.5">{field.helpText}</p>
              )}
              <FieldInput field={field} />
            </div>
          );
        })
      )}

      {/* Comments always shown */}
      <div>
        <label htmlFor="comments" className="block text-sm font-medium text-white/70 mb-1.5">Comments</label>
        <textarea
          id="comments"
          name="comments"
          rows={3}
          placeholder="Add any notes or comments..."
          className="form-input resize-none"
        />
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
          {state.error}
        </div>
      )}

      {/* Action Buttons */}
      {hasApproval || outFlows.some(f => f.conditionValue === "rejected") ? (
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            name="decision"
            value="approved"
            disabled={pending}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30 disabled:opacity-50"
          >
            {pending ? "Submitting..." : "✅ Approve"}
          </button>
          <button
            type="submit"
            name="decision"
            value="rejected"
            disabled={pending}
            className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 py-3 font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:shadow-rose-500/30 disabled:opacity-50"
          >
            {pending ? "Submitting..." : "❌ Reject"}
          </button>
        </div>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit Task →"}
        </button>
      )}
    </form>
  );
}

function FieldInput({ field }: { field: Field }) {
  const opts = field.options ? (() => { try { return JSON.parse(field.options!); } catch { return []; } })() as string[] : [];

  switch (field.type) {
    case "TEXTAREA":
      return <textarea id={field.fieldKey} name={field.fieldKey} rows={4} required={field.isRequired} placeholder={field.placeholder ?? ""} defaultValue={field.defaultValue ?? ""} className="form-input resize-none" />;
    case "NUMBER":
      return <input id={field.fieldKey} name={field.fieldKey} type="number" required={field.isRequired} placeholder={field.placeholder ?? ""} defaultValue={field.defaultValue ?? ""} className="form-input" />;
    case "DATE":
      return <input id={field.fieldKey} name={field.fieldKey} type="date" required={field.isRequired} defaultValue={field.defaultValue ?? ""} className="form-input" />;
    case "FILE":
      return <input id={field.fieldKey} name={field.fieldKey} type="file" required={field.isRequired} className="form-input cursor-pointer file:bg-violet-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:cursor-pointer" />;
    case "CHECKBOX":
      return <input id={field.fieldKey} name={field.fieldKey} type="checkbox" className="h-4 w-4 rounded accent-violet-500" />;
    case "SELECT":
      return (
        <select id={field.fieldKey} name={field.fieldKey} required={field.isRequired} defaultValue={field.defaultValue ?? ""} className="form-input">
          <option value="">Select an option...</option>
          {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case "RADIO":
      return (
        <div className="space-y-2">
          {opts.map((o: string) => (
            <label key={o} className="flex items-center gap-2 cursor-pointer text-sm text-white/70">
              <input type="radio" name={field.fieldKey} value={o} className="accent-violet-500" />
              {o}
            </label>
          ))}
        </div>
      );
    default:
      return <input id={field.fieldKey} name={field.fieldKey} type="text" required={field.isRequired} placeholder={field.placeholder ?? ""} defaultValue={field.defaultValue ?? ""} className="form-input" />;
  }
}
