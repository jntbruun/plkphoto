"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PhotoEditValues {
  slug: string;
  collection: "wildlife" | "nature" | "other";
  title: { no: string; en: string };
  latinName: string;
  location: { no: string; en: string };
  date: string;
  featuredOnHome: boolean;
  availableAsPrint: boolean;
}

export function EditForm({ photo }: { photo: PhotoEditValues }) {
  const router = useRouter();
  const [values, setValues] = useState(photo);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/photos/${photo.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          collection: values.collection,
          title: values.title,
          latinName: values.latinName,
          location: values.location,
          date: values.date,
          featuredOnHome: values.featuredOnHome,
          availableAsPrint: values.availableAsPrint,
          metadataStatus: "confirmed",
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(`Feil: ${j.error ?? res.statusText}`);
        return;
      }
      setMessage("Lagret. Live om ~90 sek.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    if (!confirm(`Slette ${photo.slug} permanent?`)) return;
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/photos/${photo.slug}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(`Feil: ${j.error ?? res.statusText}`);
        return;
      }
      router.push("/admin/photos");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-4"
    >
      <Input
        label="Tittel (norsk)"
        value={values.title.no}
        onChange={(v) => setValues({ ...values, title: { ...values.title, no: v } })}
      />
      <Input
        label="Tittel (engelsk)"
        value={values.title.en}
        onChange={(v) => setValues({ ...values, title: { ...values.title, en: v } })}
      />
      <Input
        label="Latin"
        value={values.latinName}
        onChange={(v) => setValues({ ...values, latinName: v })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Sted (norsk)"
          value={values.location.no}
          onChange={(v) =>
            setValues({ ...values, location: { ...values.location, no: v } })
          }
        />
        <Input
          label="Sted (engelsk)"
          value={values.location.en}
          onChange={(v) =>
            setValues({ ...values, location: { ...values.location, en: v } })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Dato"
          type="date"
          value={values.date}
          onChange={(v) => setValues({ ...values, date: v })}
        />
        <Select
          label="Samling"
          value={values.collection}
          onChange={(v) =>
            setValues({ ...values, collection: v as PhotoEditValues["collection"] })
          }
          options={[
            { value: "wildlife", label: "Wildlife" },
            { value: "nature", label: "Nature" },
            { value: "other", label: "Other" },
          ]}
        />
      </div>

      <div className="space-y-2 pt-2">
        <Checkbox
          label="Hero-bilde på forsiden"
          checked={values.featuredOnHome}
          onChange={(c) => setValues({ ...values, featuredOnHome: c })}
        />
        <Checkbox
          label="Tilgjengelig som print"
          checked={values.availableAsPrint}
          onChange={(c) => setValues({ ...values, availableAsPrint: c })}
        />
      </div>

      {message && (
        <p className="text-xs text-[var(--color-muted)]">{message}</p>
      )}

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="font-display tracking-[0.15em] uppercase text-xs border border-[var(--color-fg)] px-6 py-3 hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors disabled:opacity-50"
        >
          {saving ? "Lagrer…" : "Lagre"}
        </button>
        <button
          type="button"
          onClick={destroy}
          disabled={deleting}
          className="font-display tracking-[0.15em] uppercase text-xs text-red-600 border border-red-600 px-6 py-3 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
        >
          {deleting ? "Sletter…" : "Slett"}
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs tracking-[0.15em] uppercase mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-fg)]"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-xs tracking-[0.15em] uppercase mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-fg)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="border-[var(--color-line)]"
      />
      <span>{label}</span>
    </label>
  );
}
