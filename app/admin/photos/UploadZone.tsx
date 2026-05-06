"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";

interface QueueItem {
  id: string;
  file: File;
  status: "pending" | "compressing" | "uploading" | "done" | "error";
  message?: string;
  slug?: string;
}

interface MetaForm {
  commonNameNo: string;
  commonNameEn: string;
  latinName: string;
  collection: "wildlife" | "nature" | "other";
  locationNo: string;
  locationEn: string;
}

const EMPTY_FORM: MetaForm = {
  commonNameNo: "",
  commonNameEn: "",
  latinName: "",
  collection: "wildlife",
  locationNo: "",
  locationEn: "",
};

export function UploadZone() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [form, setForm] = useState<MetaForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setQueue(
      files.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        file,
        status: "pending",
      })),
    );
  }

  function patchItem(id: string, patch: Partial<QueueItem>) {
    setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  async function uploadOne(item: QueueItem): Promise<void> {
    try {
      patchItem(item.id, { status: "compressing" });
      const compressed = await imageCompression(item.file, {
        maxSizeMB: 3.5,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.85,
      });

      patchItem(item.id, { status: "uploading" });
      const fd = new FormData();
      fd.append("file", compressed, item.file.name);
      fd.append("commonNameNo", form.commonNameNo);
      fd.append("commonNameEn", form.commonNameEn);
      fd.append("latinName", form.latinName);
      fd.append("collection", form.collection);
      fd.append("locationNo", form.locationNo);
      fd.append("locationEn", form.locationEn);

      const res = await fetch("/api/admin/photos", { method: "POST", body: fd });
      const json = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok) {
        patchItem(item.id, { status: "error", message: json.error ?? "Feil" });
        return;
      }
      patchItem(item.id, { status: "done", slug: json.slug });
    } catch (err) {
      patchItem(item.id, {
        status: "error",
        message: err instanceof Error ? err.message : "Feil",
      });
    }
  }

  async function startUpload() {
    if (!form.commonNameEn || !form.commonNameNo || queue.length === 0) return;
    setUploading(true);
    const slots = 2;
    const items = [...queue];
    let i = 0;
    async function worker() {
      while (i < items.length) {
        const idx = i++;
        await uploadOne(items[idx]!);
      }
    }
    await Promise.all(Array.from({ length: slots }, worker));
    setUploading(false);
    router.refresh();
  }

  function reset() {
    setQueue([]);
    setForm(EMPTY_FORM);
    if (inputRef.current) inputRef.current.value = "";
  }

  const allDone = queue.length > 0 && queue.every((q) => q.status === "done");

  return (
    <section className="border border-dashed border-[var(--color-line)] p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-sm tracking-[0.2em] uppercase">Last opp</h2>
        {queue.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="text-xs tracking-[0.15em] uppercase text-[var(--color-muted)] hover:text-[var(--color-fg)]"
          >
            Tilbakestill
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Art (norsk)" value={form.commonNameNo} onChange={(v) => setForm({ ...form, commonNameNo: v })} placeholder="Ekorn" />
        <Field label="Art (engelsk)" value={form.commonNameEn} onChange={(v) => setForm({ ...form, commonNameEn: v })} placeholder="Eurasian Red Squirrel" />
        <Field label="Latin" value={form.latinName} onChange={(v) => setForm({ ...form, latinName: v })} placeholder="Sciurus vulgaris" />
        <SelectField
          label="Samling"
          value={form.collection}
          onChange={(v) => setForm({ ...form, collection: v as MetaForm["collection"] })}
          options={[
            { value: "wildlife", label: "Wildlife" },
            { value: "nature", label: "Nature" },
            { value: "other", label: "Other" },
          ]}
        />
        <Field label="Sted (norsk)" value={form.locationNo} onChange={(v) => setForm({ ...form, locationNo: v })} placeholder="Bymarka" />
        <Field label="Sted (engelsk)" value={form.locationEn} onChange={(v) => setForm({ ...form, locationEn: v })} placeholder="Bymarka" />
      </div>

      <div>
        <label className="block">
          <span className="block text-xs tracking-[0.15em] uppercase mb-2">
            Velg bildefiler
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            onChange={onPick}
            disabled={uploading}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:border file:border-[var(--color-fg)] file:bg-transparent file:text-[var(--color-fg)] file:text-xs file:tracking-[0.15em] file:uppercase file:cursor-pointer hover:file:bg-[var(--color-fg)] hover:file:text-[var(--color-bg)] file:transition-colors"
          />
        </label>
        <p className="text-xs text-[var(--color-muted)] mt-2">
          Bildene komprimeres til 2400px før opplasting. Velg flere på én gang —
          alle får samme art og sted.
        </p>
      </div>

      {queue.length > 0 && (
        <ul className="space-y-2 text-sm">
          {queue.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between border border-[var(--color-line)] px-3 py-2"
            >
              <span className="truncate">{it.file.name}</span>
              <span
                className={`text-xs tracking-[0.15em] uppercase ${
                  it.status === "error"
                    ? "text-red-600"
                    : it.status === "done"
                      ? "text-green-600"
                      : "text-[var(--color-muted)]"
                }`}
              >
                {it.status === "pending" && "Venter"}
                {it.status === "compressing" && "Komprimerer"}
                {it.status === "uploading" && "Laster opp"}
                {it.status === "done" && (it.slug ?? "Ferdig")}
                {it.status === "error" && (it.message ?? "Feil")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-end gap-3">
        {allDone && (
          <p className="text-xs text-[var(--color-muted)]">
            Live på siden om ~90 sek.
          </p>
        )}
        <button
          type="button"
          onClick={startUpload}
          disabled={
            uploading ||
            queue.length === 0 ||
            !form.commonNameEn ||
            !form.commonNameNo ||
            allDone
          }
          className="font-display tracking-[0.15em] uppercase text-xs border border-[var(--color-fg)] px-6 py-3 hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading ? "Laster opp…" : "Last opp"}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs tracking-[0.15em] uppercase mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-fg)]"
      />
    </label>
  );
}

function SelectField({
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
