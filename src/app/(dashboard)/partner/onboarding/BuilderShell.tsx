"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

// Drag and drop runtime engines
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const TYPES = ["TEXT", "NUMBER", "DATE", "DROPDOWN", "FILE"];

/* ==========================================
   SUB-COMPONENT: ROW DROPPABLE TRACKER
   ========================================== */
function FieldRow({ field, onDelete }: { field: any; onDelete: () => void }) {
  const id = field.id || field.field_id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : 1,
      }}
      className="flex items-center gap-3 rounded-none border border-surface-border bg-card p-3 shadow-sm group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-content-muted hover:text-primary focus:outline-none p-1"
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-secondary truncate">
            {field.field_label}
          </span>
          <span className="rounded-none bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider">
            {field.field_type}
          </span>
          {field.is_required && (
            <span className="rounded-none bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-destructive">
              Required
            </span>
          )}
        </div>
        <p className="text-[10px] font-mono text-content-muted mt-0.5 truncate">
          Key: {field.field_key}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="rounded-none text-content-muted hover:text-destructive hover:bg-destructive/5 shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ==========================================
   SUB-COMPONENT: LIVE SCHEMA PREVIEW CANVAS
   ========================================== */
function PreviewCanvas({ fields }: { fields: any[] }) {
  return (
    <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-card sticky top-24">
      <h3 className="text-xs font-bold uppercase tracking-wider text-content-muted border-b border-surface-border pb-3">
        Interactive Preview Shell
      </h3>
      <div className="mt-4 space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
        {fields.length === 0 && (
          <p className="text-xs text-content-muted italic py-4 text-center">
            No structural controls mapped yet.
          </p>
        )}
        {fields.map((f) => (
          <div key={f.id || f.field_id} className="space-y-1.5">
            <Label className="text-xs font-medium text-secondary">
              {f.field_label || "Untitled Field"}
              {f.is_required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            {f.field_type === "TEXT" && (
              <Input disabled className="rounded-none" />
            )}
            {f.field_type === "NUMBER" && (
              <Input type="number" disabled className="rounded-none" />
            )}
            {f.field_type === "DATE" && (
              <Input type="date" disabled className="rounded-none" />
            )}
            {f.field_type === "FILE" && (
              <Input
                type="file"
                disabled
                className="rounded-none text-xs file:font-sans"
              />
            )}
            {f.field_type === "DROPDOWN" && (
              <select
                disabled
                className="w-full h-10 rounded-none border border-surface-border bg-muted/40 px-3 py-2 text-xs text-content-muted outline-none appearance-none"
              >
                <option>
                  {f.field_options?.[0]
                    ? `Select ${f.field_options[0]}...`
                    : "Select parameter..."}
                </option>
              </select>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ==========================================
   PRIMARY BULDER MANAGER SHELL
   ========================================== */
export default function BuilderShell({
  initialFields,
}: {
  initialFields: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fields, setFields] = useState(initialFields);
  const [isMutating, setIsMutating] = useState(false);

  const [draft, setDraft] = useState({
    label: "",
    field_type: "TEXT",
    is_required: false,
    options: "",
  });

  // Sync state if server context invalidates or delivers updated arrays down the pipe
  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Process dynamic array adjustments natively on execution end
  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;

    const oldIndex = fields.findIndex(
      (f) => (f.id || f.field_id) === e.active.id,
    );
    const newIndex = fields.findIndex(
      (f) => (f.id || f.field_id) === e.over!.id,
    );

    const reorderedArray = arrayMove(fields, oldIndex, newIndex);

    // Optimistic runtime state patch for immediate user UI execution
    setFields(reorderedArray);

    try {
      // Loop execution updates positional coordinates back down the API layer asynchronously
      await Promise.all(
        reorderedArray.map((f, idx) =>
          api(`/onboarding/fields/${f.id || f.field_id}`, {
            method: "PUT",
            body: { display_order: idx },
          }),
        ),
      );
      toast.success("Structural form sequence locked.");
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      toast.error("Failed to commit sequence permutation parameters.");
      setFields(initialFields);
    }
  };

  const handleAddField = async () => {
    if (!draft.label.trim()) return;

    const fieldKey = draft.label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const payload: any = {
      field_label: draft.label.trim(),
      field_key: fieldKey,
      field_type: draft.field_type,
      is_required: draft.is_required,
      display_order: fields.length,
    };

    if (draft.field_type === "DROPDOWN" && draft.options) {
      payload.field_options = draft.options
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    setIsMutating(true);
    try {
      await api("/onboarding/fields", { method: "POST", body: payload });
      toast.success("New validation control injected successfully.");
      setDraft({
        label: "",
        field_type: "TEXT",
        is_required: false,
        options: "",
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (e: any) {
      toast.error(e.message || "Operation failed.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    setIsMutating(true);
    try {
      await api(`/onboarding/fields/${id}`, { method: "DELETE" });
      toast.success("Control node dropped.");
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      toast.error("Failed to destroy validation control.");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      {/* BUILDER PANEL SECTOR */}
      <div className="space-y-4">
        <Card className="p-5 border border-surface-border shadow-soft rounded-none bg-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-4">
            Append Meta Control Node
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-content-muted">
                Field Label String
              </Label>
              <Input
                value={draft.label}
                className="rounded-none border-surface-border"
                placeholder="e.g. Total Capital Gains Details"
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-content-muted">
                  Data Classification Type
                </Label>
                <Select
                  value={draft.field_type}
                  onValueChange={(v) => setDraft({ ...draft, field_type: v })}
                >
                  <SelectTrigger className="rounded-none border-surface-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {TYPES.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        className="rounded-none font-mono text-xs"
                      >
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 h-10 pt-5">
                <Switch
                  id="req"
                  checked={draft.is_required}
                  onCheckedChange={(v) =>
                    setDraft({ ...draft, is_required: v })
                  }
                />
                <Label
                  htmlFor="req"
                  className="text-xs font-semibold text-secondary cursor-pointer selection:bg-transparent"
                >
                  Enforce Verification
                </Label>
              </div>
            </div>

            {draft.field_type === "DROPDOWN" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
                <Label className="text-xs font-semibold text-content-muted">
                  Dropdown Matrix Options (Line Delimited)
                </Label>
                <Textarea
                  rows={3}
                  value={draft.options}
                  className="rounded-none border-surface-border resize-none text-xs"
                  placeholder="Salaried&#10;Self-Employed&#10;NRI Professional"
                  onChange={(e) =>
                    setDraft({ ...draft, options: e.target.value })
                  }
                />
              </div>
            )}

            <Button
              onClick={handleAddField}
              disabled={!draft.label.trim() || isMutating || isPending}
              className="rounded-none font-medium mt-2 w-full sm:w-auto"
            >
              {isMutating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Append Form Control
            </Button>
          </div>
        </Card>

        {/* DRAG DROPPABLE CONTAINER FIELD WRAPPER */}
        <div className="relative">
          {(isMutating || isPending) && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-20 flex items-center justify-center pointer-events-none" />
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={fields.map((f) => f.id || f.field_id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {fields.map((f) => (
                  <FieldRow
                    key={f.id || f.field_id}
                    field={f}
                    onDelete={() => handleDeleteField(f.id || f.field_id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* DETACHED SIMULATION PANEL GRID */}
      <PreviewCanvas fields={fields} />
    </div>
  );
}
