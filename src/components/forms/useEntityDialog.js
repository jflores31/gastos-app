import { useState } from "react";

// State and handlers for a "create / edit / delete" dialog: goals, accounts, investments,
// debts and subscriptions all share this shape.
// - `toForm(item)` turns a stored item into form values (e.g. PEN amounts → chosen currency).
// - `messages` are the toast texts: { saved, saveError, deleted, deleteError }.
export function useEntityDialog({ empty, toForm = (item) => item, save, remove, showToast, messages }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(toForm(item)); setOpen(true); };
  const close = () => { setOpen(false); setEditing(null); };
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  // `item` is the form already converted to what the context's save*() expects.
  const submit = async (item) => {
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

  const destroy = async (id) => {
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
