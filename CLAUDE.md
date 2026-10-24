# SecondLife Vision

A web app: the user uploads a photo of a discarded object. The app identifies the object and its materials, runs a safety check, and returns three reuse concepts (repair, repurpose, upcycle), each with a generated image and steps, plus a material recovery plan. Built in a 2-hour hackathon. It must deploy to Vercel and be safe to demo live.

## Stack
- Next.js (App Router), TypeScript strict, Tailwind CSS.
- @google/genai for Gemini. Model from env GEMINI_MODEL, default "gemini-3.8-flash"; fallback GEMINI_FALLBACK_MODEL, default "gemini-3.5-flash-lite". Never use gemini-2.x models.
- zod to validate env vars and every external response.
- Images through a provider interface: Pollinations (default, no key) and Cloudflare Workers AI "@cf/black-forest-labs/flux-1-schnell".
- vitest for unit tests of pure logic.
- lucide-react for icons, used sparingly. No UI kits or component generators. Ask before adding any other dependency.
- When unsure of a library API, read its type definitions in node_modules. Do not guess.

## Structure
- app/page.tsx, app/api/analyze/route.ts, app/api/image/route.ts
- components/ : one component per file, PascalCase names
- lib/ai/ (client.ts, prompt.ts, schema.ts), lib/safety.ts, lib/image/ (types.ts, pollinations.ts, cloudflare.ts, index.ts), lib/env.ts, lib/resize.ts
- types/analysis.ts : domain types inferred from the zod schema. Single source of truth.
- fixtures/ : demo-mode results and test photos

## Code standards
- Write code like a senior engineer on a small product team: small, plain, readable. Good names over comments. Comment only the why, never the what. No banner comments, no commented-out code, no leftover TODOs.
- No emoji anywhere: code, comments, UI copy, commit messages, README.
- No `any`. Narrow unknown data with zod.
- Secrets only in server code. Mark server modules with `import "server-only"`.
- Handle errors at boundaries. Route handlers return `{ error: { code, message } }` with the right HTTP status. The UI shows a plain message and a retry.
- No console.log in committed code (console.error in route handlers is fine).
- Functions under ~40 lines, components under ~150 lines. Extract when bigger.
- Before calling a task done, run `npm run lint`, `npm run typecheck` and `npm test`, and fix what fails.

## Git
- Commit after each finished task. Conventional Commits, imperative, lowercase, no trailing period, no emoji, no trailers. Example: feat(api): add analyze route with schema validation
- Small focused commits. Do not bundle unrelated changes.

## Design direction
- Feel: a calm, utilitarian public tool. Think a well-made municipal kiosk crossed with a field guide. Confident, quiet, specific.
- Colours: background #F6F4EF (warm off-white), ink #1A1A1A, muted text #5C5A55, borders #DAD6CC, one accent #1F5F3F (deep green). Status colours only for safety: red #B42318, amber #B54708, green #067647.
- Type: IBM Plex Sans for UI, IBM Plex Mono for data (materials, numbers, actions), loaded with next/font. At most five type sizes.
- Layout: clear grid, generous whitespace, 1px borders, 6-8px radius, almost no shadows.
- Never use: purple or blue gradients, glassmorphism, glowing blobs, sparkle or magic-wand icons, "AI-powered" badges, rounded-3xl cards with heavy shadows, centered hero with giant gradient headline, stock illustration.

## Copy
- Short, plain, specific. Sentence case. No exclamation marks.
- Banned words: unleash, magic, seamless, revolutionize, effortless, empower, cutting-edge, AI-powered.
- Say what it does. Example headline: "Take a photo of something you're about to throw away."

## Accessibility
- Semantic HTML, labelled inputs, visible focus states, alt text, WCAG AA contrast, keyboard-complete flow, works at 375px width.

## Product rules
- The safety gate runs before any concept is shown. Hazardous items: red banner, no DIY concepts, recovery plan only. Never suggest reusing hazardous items for food, children or skin contact. The gate may raise risk but never lower what the model reported.
- Impact numbers are always labelled "estimate".
- Demo mode (?demo=1 or DEMO_MODE=true) serves fixtures with zero network calls
