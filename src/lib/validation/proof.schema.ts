import { z } from "zod";

export const proofCategories = ["Training", "Education", "Work", "Sports", "Other"] as const;

export const proofSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(80, "Title must be under 80 characters"),
  description: z.string().trim().max(500, "Description must be under 500 characters").optional(),
  category: z.enum(proofCategories, { error: "Invalid category" }),
  payerAccountId: z.string().regex(/^(0|(0\.\d+))\.(0|(0\.\d+))\.\d+$/, "Invalid Hedera account ID format"),
  recipientAccountId: z.string().trim().regex(/^(0|(0\.\d+))\.(0|(0\.\d+))\.\d+$/, "Invalid Hedera account ID format").optional().or(z.literal("")),
  issuerName: z.string().trim().max(50, "Issuer name must be under 50 characters").optional().default("ProofMint Agent"),
  clientRequestId: z.string().uuid("Invalid request ID").optional(),
});

export type ProofSchemaInput = z.infer<typeof proofSchema>;
