"use client";

import { FormEvent, useState } from "react";
import { proofSchema, ProofSchemaInput, proofCategories } from "@/lib/validation/proof.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AchievementFormProps {
  payerAccountId: string | null;
  onSubmit: (data: ProofSchemaInput) => void;
  isPending: boolean;
}

type FormErrors = Partial<Record<keyof ProofSchemaInput, string>>;

export function AchievementForm({ payerAccountId, onSubmit, isPending }: AchievementFormProps) {
  const [values, setValues] = useState<ProofSchemaInput>({
    title: "",
    description: "",
    category: "Education",
    payerAccountId: "",
    recipientAccountId: "",
    issuerName: "ProofMint Agent",
    clientRequestId: crypto.randomUUID(),
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function updateField<K extends keyof ProofSchemaInput>(key: K, value: ProofSchemaInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handlePreset(preset: "training" | "hackathon") {
    const next =
      preset === "training"
        ? {
            title: "Advanced Taekwondo Training Completed",
            description: "Completed a verified martial arts training milestone.",
            category: "Training" as const,
          }
        : {
            title: "AI Hackathon ProofMint Demo",
            description: "Built and demonstrated a payment-triggered Hedera proof agent.",
            category: "Work" as const,
          };

    setValues((current) => ({
      ...current,
      ...next,
      clientRequestId: crypto.randomUUID(),
    }));
    setErrors({});
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = proofSchema.safeParse({
      ...values,
      payerAccountId: payerAccountId || values.payerAccountId,
      recipientAccountId: values.recipientAccountId || undefined,
      clientRequestId: values.clientRequestId || crypto.randomUUID(),
    });

    if (!parsed.success) {
      const nextErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ProofSchemaInput | undefined;
        if (field) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => handlePreset("training")}>
          Taekwondo Black Belt
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => handlePreset("hackathon")}>
          AI Hackathon Win
        </Button>
      </div>

      <FieldError error={errors.title}>
        <Label htmlFor="title">Achievement Title *</Label>
        <Input
          id="title"
          placeholder="Advanced Taekwondo Training Completed"
          value={values.title}
          onChange={(event) => updateField("title", event.target.value)}
        />
      </FieldError>

      <FieldError error={errors.category}>
        <Label>Category *</Label>
        <Select value={values.category} onValueChange={(value) => updateField("category", value as ProofSchemaInput["category"])}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {proofCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldError>

      <FieldError error={errors.description}>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          placeholder="Details about this achievement"
          value={values.description || ""}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </FieldError>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldError error={errors.payerAccountId}>
          <Label htmlFor="payerAccountId">Payer Account ID</Label>
          <Input id="payerAccountId" value={payerAccountId || ""} readOnly className="bg-muted font-mono" />
          <p className="text-xs text-muted-foreground">Billed account</p>
        </FieldError>

        <FieldError error={errors.recipientAccountId}>
          <Label htmlFor="recipientAccountId">Recipient Account ID</Label>
          <Input
            id="recipientAccountId"
            placeholder={payerAccountId || "0.0.xxxxx"}
            value={values.recipientAccountId || ""}
            onChange={(event) => updateField("recipientAccountId", event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Defaults to payer</p>
        </FieldError>
      </div>

      <Button type="submit" disabled={isPending || !payerAccountId} className="w-full">
        Proceed to Payment
      </Button>
    </form>
  );
}

function FieldError({ children, error }: { children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-2">
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
