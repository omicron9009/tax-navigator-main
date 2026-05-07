import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/partner/onboarding/")({ component: OnboardingBuilder });

const TYPES = ["TEXT", "NUMBER", "DATE", "DROPDOWN", "FILE"];

function FieldRow({ field, onDelete }: { field: any; onDelete: () => void }) {
  const id = field.id || field.field_id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 rounded-md border bg-card p-3"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{field.field_label || field.label}</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{field.field_type}</span>
          {field.is_required && <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-destructive">Required</span>}
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

function Preview({ fields }: { fields: any[] }) {
  return (
    <Card className="p-5 sticky top-20">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Preview</h3>
      <div className="mt-4 space-y-4">
        {fields.length === 0 && <p className="text-sm text-muted-foreground">Add fields to see preview</p>}
        {fields.map((f) => (
          <div key={f.id || f.field_id} className="space-y-1.5">
            <Label>{f.field_label || f.label}{f.is_required && <span className="text-destructive ml-1">*</span>}</Label>
            {f.field_type === "TEXT" && <Input disabled />}
            {f.field_type === "NUMBER" && <Input type="number" disabled />}
            {f.field_type === "DATE" && <Input type="date" disabled />}
            {f.field_type === "FILE" && <Input type="file" disabled />}
            {f.field_type === "DROPDOWN" && (
              <select disabled className="w-full rounded-md border bg-muted px-3 py-2 text-sm">
                <option>Select…</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function OnboardingBuilder() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-fields"],
    queryFn: () => api<any>("/onboarding/fields"),
  });
  const fields: any[] = data?.items || data?.fields || data || [];

  const [draft, setDraft] = useState({ label: "", field_type: "TEXT", is_required: false, options: "" });

  const create = useMutation({
    mutationFn: (b: any) => api("/onboarding/fields", { method: "POST", body: b }),
    onSuccess: () => { toast.success("Field added"); setDraft({ label: "", field_type: "TEXT", is_required: false, options: "" }); qc.invalidateQueries({ queryKey: ["onboarding-fields"] }); },
    onError: (e: any) => toast.error(e.message || "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => api(`/onboarding/fields/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["onboarding-fields"] }); },
  });
  const updateOrder = useMutation({
    mutationFn: (vars: { id: string; order: number }) =>
      api(`/onboarding/fields/${vars.id}`, { method: "PUT", body: { display_order: vars.order } }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIndex = fields.findIndex((f) => (f.id || f.field_id) === e.active.id);
    const newIndex = fields.findIndex((f) => (f.id || f.field_id) === e.over!.id);
    const next = arrayMove(fields, oldIndex, newIndex);
    qc.setQueryData(["onboarding-fields"], { ...(data || {}), items: next, fields: next });
    next.forEach((f, i) => updateOrder.mutate({ id: f.id || f.field_id, order: i }));
  };

  const submit = () => {
    if (!draft.label.trim()) return;
    const fieldKey = draft.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const body: any = {
      field_label: draft.label, field_key: fieldKey, field_type: draft.field_type, is_required: draft.is_required, display_order: fields.length,
    };
    if (draft.field_type === "DROPDOWN" && draft.options) {
      body.field_options = draft.options.split("\n").map((s) => s.trim()).filter(Boolean);
    }
    create.mutate(body);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding Form</h1>
        <p className="text-sm text-muted-foreground">Define the form clients fill on their first filing</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Add field</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={draft.field_type} onValueChange={(v) => setDraft({ ...draft, field_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Switch id="req" checked={draft.is_required} onCheckedChange={(v) => setDraft({ ...draft, is_required: v })} />
                  <Label htmlFor="req" className="cursor-pointer">Required</Label>
                </div>
              </div>
              {draft.field_type === "DROPDOWN" && (
                <div className="space-y-1.5">
                  <Label>Options (one per line)</Label>
                  <Textarea rows={3} value={draft.options} onChange={(e) => setDraft({ ...draft, options: e.target.value })} />
                </div>
              )}
              <Button onClick={submit} disabled={!draft.label.trim() || create.isPending}>
                <Plus className="h-4 w-4 mr-1" /> Add field
              </Button>
            </div>
          </Card>

          {isLoading ? <Skeleton className="h-64" /> : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={fields.map((f) => f.id || f.field_id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {fields.map((f) => (
                    <FieldRow key={f.id || f.field_id} field={f} onDelete={() => del.mutate(f.id || f.field_id)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <Preview fields={fields} />
      </div>
    </div>
  );
}
