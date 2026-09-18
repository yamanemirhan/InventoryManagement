"use client";
import { useEffect, useRef } from "react";
import { Button } from "./button";
import { useI18n } from "@/lib/i18n/provider";
export function ConfirmDialog({
  description,
  pending,
  onConfirm,
  onClose,
}: {
  description: string;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { m } = useI18n();

  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-md rounded-2xl border border-line bg-surface p-7 text-ink shadow-xl backdrop:bg-ink/30"
    >
      <h2 id="confirm-title" className="text-lg font-semibold">
        {m.orders.confirmTitle}
      </h2>
      <p id="confirm-description" className="mt-3 text-sm leading-6 text-muted">
        {description}
      </p>
      <div className="mt-7 flex justify-end gap-3">
        <Button
          autoFocus
          variant="secondary"
          disabled={pending}
          onClick={onClose}
        >
          {m.common.cancel}
        </Button>
        <Button disabled={pending} onClick={onConfirm}>
          {pending ? m.common.pending : m.orders.confirm}
        </Button>
      </div>
    </dialog>
  );
}
