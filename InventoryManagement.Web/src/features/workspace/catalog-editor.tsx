"use client";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCompanyText } from "@/features/companies/company-provider";

type Props = {
  kind: "products" | "warehouses" | "suppliers";
  id: string;
  name: string;
  value: string;
};
export function CatalogEditor(props: Props) {
  const [editing, setEditing] = useState(false);
  const t = useCompanyText();
  return editing ? (
    <Editor {...props} onClose={() => setEditing(false)} />
  ) : (
    <Button variant="secondary" onClick={() => setEditing(true)}>
      {t("Bilgileri düzenle", "Edit details")}
    </Button>
  );
}
function Editor({
  kind,
  id,
  name: initialName,
  value: initialValue,
  onClose,
}: Props & { onClose: () => void }) {
  const t = useCompanyText();
  const client = useQueryClient();
  const [name, setName] = useState(initialName);
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const key =
    kind === "products" ? "sku" : kind === "warehouses" ? "location" : "email";
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiClient(`/api/${kind}/${id}`, {
        method: "PUT",
        body: { id, name: name.trim(), [key]: value.trim() },
      });
      await client.invalidateQueries();
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("Kaydedilemedi.", "Unable to save."),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={save}
      className="mt-5 w-full space-y-4 rounded-xl border border-line bg-subtle p-5"
    >
      <h3 className="font-semibold">
        {t("Bilgileri düzenle", "Edit details")}
      </h3>
      <label className="block space-y-2 text-sm">
        {t("Ad", "Name")}
        <Input
          required
          maxLength={kind === "warehouses" ? 150 : 200}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
      </label>
      <label className="block space-y-2 text-sm">
        {key === "sku"
          ? "SKU"
          : key === "location"
            ? t("Konum", "Location")
            : t("E-posta", "Email")}
        <Input
          required
          type={key === "email" ? "email" : "text"}
          maxLength={key === "sku" ? 100 : key === "location" ? 300 : 320}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button disabled={busy || !name.trim() || !value.trim()}>
          {busy ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
          {t("Vazgeç", "Cancel")}
        </Button>
      </div>
    </form>
  );
}
