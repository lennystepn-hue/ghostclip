import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const clipCreateSchema = z.object({
  type: z.enum(["text", "image", "file", "url"]),
  contentEnc: z.string(),
  previewEnc: z.string().nullable(),
  contentHash: z.string(),
  sourceApp: z.string().nullable(),
  tags: z.array(z.string()),
  summary: z.string().nullable(),
  mood: z.string().nullable(),
  actions: z.array(
    z.object({
      label: z.string(),
      type: z.enum(["suggestion", "reminder", "link", "template"]),
      payload: z.record(z.unknown()),
    })
  ),
  sensitivity: z.string().nullable(),
  autoExpire: z.string().datetime().nullable(),
  aiRaw: z.record(z.unknown()).nullable(),
});

export const collectionCreateSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10),
  smartRule: z.record(z.unknown()).nullable(),
});

export const replyTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  template: z.string().min(1).max(10000),
  context: z.record(z.unknown()),
});
