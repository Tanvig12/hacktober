import "server-only";
import { z } from "zod";

const required = z.string({ error: "is required" }).min(1, "is required");

const envSchema = z
  .object({
    GEMINI_API_KEY: required,
    GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
    GEMINI_FALLBACK_MODEL: z.string().default("gemini-3.5-flash-lite"),
    IMAGE_PROVIDER: z
      .enum(["pollinations", "cloudflare"])
      .default("pollinations"),
    CF_ACCOUNT_ID: z.string().optional(),
    CF_API_TOKEN: z.string().optional(),
    DEMO_MODE: z.stringbool().default(false),
  })
  .superRefine((env, ctx) => {
    if (env.IMAGE_PROVIDER !== "cloudflare") return;
    for (const key of ["CF_ACCOUNT_ID", "CF_API_TOKEN"] as const) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "is required when IMAGE_PROVIDER is cloudflare",
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

type EnvSource = Record<string, string | undefined>;

// An empty value in .env.local means "unset", so defaults still apply.
function dropEmpty(source: EnvSource): EnvSource {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== ""),
  );
}

export function parseEnv(source: EnvSource): Env {
  const result = envSchema.safeParse(dropEmpty(source));
  if (result.success) return result.data;

  const lines = result.error.issues.map(
    (issue) => `  ${issue.path.join(".")}: ${issue.message}`,
  );
  throw new Error(
    `Invalid environment variables:\n${lines.join("\n")}\nSee .env.example.`,
  );
}

let cached: Env | undefined;

// Parsed on first use rather than at import so `next build` works without secrets.
export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
