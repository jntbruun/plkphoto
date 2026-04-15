"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(10),
  reference: z.string().optional(),
  website: z.string().optional(), // honeypot
});

type FormValues = z.infer<typeof schema>;

interface ContactFormProps {
  initialReference?: string;
}

export default function ContactForm({ initialReference }: ContactFormProps) {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reference: initialReference ?? "" },
  });

  async function onSubmit(data: FormValues) {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Server error");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="py-8">
        <p className="font-display text-2xl font-light mb-2">{t("successHeading")}</p>
        <p className="text-[var(--color-muted)]">{t("successText")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {/* Honeypot */}
      <input
        {...register("website")}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <Field label={t("fields.name")} error={errors.name?.message}>
        <input
          {...register("name")}
          type="text"
          autoComplete="name"
          className={fieldClass(!!errors.name)}
        />
      </Field>

      <Field label={t("fields.email")} error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className={fieldClass(!!errors.email)}
        />
      </Field>

      <Field label={t("fields.message")} error={errors.message?.message}>
        <textarea
          {...register("message")}
          rows={6}
          className={cn(fieldClass(!!errors.message), "resize-y")}
        />
      </Field>

      <Field label={t("fields.reference")} error={undefined}>
        <input
          {...register("reference")}
          type="text"
          className={fieldClass(false)}
        />
      </Field>

      {status === "error" && (
        <p className="text-sm text-red-600">{t("errorText")}</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className={cn(
          "self-start text-sm border-b border-[var(--color-fg)] pb-0.5 transition-opacity",
          status === "sending" ? "opacity-40 cursor-not-allowed" : "hover:opacity-60",
        )}
      >
        {status === "sending" ? t("sending") : t("submit")} {status !== "sending" && "→"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-[var(--color-muted)]">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function fieldClass(hasError: boolean) {
  return cn(
    "w-full bg-transparent border-b py-2 text-sm outline-none transition-colors",
    "placeholder:text-[var(--color-line)]",
    hasError
      ? "border-red-400 focus:border-red-600"
      : "border-[var(--color-line)] focus:border-[var(--color-fg)]",
  );
}
