import { useState } from "react";
import type { ShowToast } from "../feedback/useToast";

export type EntityMessages = { saved: string; saveError: string; deleted: string; deleteError: string };

type Options<Item extends { id: string }, Form, Saved> = {
  empty: Form;
  toForm?: (item: Item) => Form;
  save: (item: Saved) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  showToast?: ShowToast;
  messages: EntityMessages;
};

// What EntityDialog needs from the hook.
export type EntityDialogControls = {
  open: boolean;
  editing: { id: string } | null;
  saving: boolean;
  close: () => void;
  destroy: (id: string) => Promise<void>;
};

// State and handlers for a "create / edit / delete" dialog: goals, accounts, investments,
// debts and subscriptions all share this shape.
// - `toForm(item)` turns a stored item into form values (e.g. PEN amounts → chosen currency).
// - `messages` are the toast texts: { saved, saveError, deleted, deleteError }.
export function useEntityDialog<Item extends { id: string }, Form, Saved = Form>(
  { empty, toForm = (item) => item as unknown as Form, save, remove, showToast, messages }: Options<Item, Form, Saved>,
) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (item: Item) => { setEditing(item); setForm(toForm(item)); setOpen(true); };
  const close = () => { setOpen(false); setEditing(null); };
  const update = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  // `item` is the form already converted to what the context's save*() expects.
  const submit = async (item: Saved) => {
    setSaving(true);
    try {
      await save(item);
      showToast?.(messages.saved, "success");
      close();
    } catch {
      showToast?.(messages.saveError, "error");
    } finally {
      setSaving(false);
    }
  };

  const destroy = async (id: string) => {
    try {
      await remove(id);
      showToast?.(messages.deleted, "success");
    } catch {
      showToast?.(messages.deleteError, "error");
    }
    close();
  };

  return { open, editing, form, update, saving, openNew, openEdit, close, submit, destroy };
}
