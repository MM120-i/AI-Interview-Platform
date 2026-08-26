# PrepPilot — AI Mock Interview Platform

AI-powered mock interview app to practice real interview questions and get instant feedback. Built with Next.js 16, React 19, Tailwind CSS v4.

## Features

- **AI Interview Practice** — `app/(root)/page.tsx` CTA `Start an Interview` → `/interview` (Vapi + LLM integration ready)
- **Auth** — `app/(auth)/sign-in`, `app/(auth)/sign-up` with `components/AuthForm.tsx` (react-hook-form + zod)
- **Reusable Form** — `components/FormField.tsx` generic `<T extends FieldValues>` wrapper around `components/ui/form.tsx`
- **Toasts** — `sonner` via `app/layout.tsx:21`
- **Design System** — shadcn `base-nova`, `dark` mode, `Mona Sans`, custom `@theme` tokens in `app/globals.css`

## Tech Stack

| Layer     | Choice                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| Framework | `next@16.3.2` (Turbopack), `react@19.2.8`                                                                    |
| Styling   | `tailwindcss@4`, `@tailwindcss/postcss@4`, `tw-animate-css@1.4.0` (v4 replacement for `tailwindcss-animate`) |
| UI        | `shadcn@4.19.0`, `@base-ui/react@1.7.0`, `class-variance-authority`, `lucide-react`                          |
| Forms     | `react-hook-form@7.86`, `@hookform/resolvers@5.9`, `zod@4.4.3` (`z.email()` not `z.string().email()`)        |
| Tooling   | `typescript@5`, `eslint@9` (flat config), `prettier@3.9` + `prettier-plugin-tailwindcss@0.8`                 |

## Getting Started

```bash
# install
npm install

# dev (Turbopack)
npm run dev
# → http://localhost:3000

# build
npm run build
npm start

# lint / format
npm run lint
npx prettier --check .
npx prettier --write .
```

No env required yet. When adding Firebase/Vapi/Gemini, create `.env.local`:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
# Vapi
NEXT_PUBLIC_VAPI_WEB_TOKEN=
# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Project Structure

```
app/
  layout.tsx          # Root layout, Mona_Sans, Toaster, metadata "PrepPilot"
  globals.css         # @import "tailwindcss"; @import "tw-animate-css"; @theme tokens
  (root)/
    layout.tsx        # Nav with logo.svg + {children}
    page.tsx          # Hero card-cts + robot.png
  (auth)/
    layout.tsx        # Auth layout
    sign-in/page.tsx  # <AuthForm type="sign-in" />
    sign-up/page.tsx  # <AuthForm type="sign-up" />
components/
  AuthForm.tsx        # Client form, AuthFormSchema(type), zodResolver, toast + router
  FormField.tsx       # Generic <T extends FieldValues> Controller wrapper
  ui/
    button.tsx        # Base UI Button + cva variants, supports `asChild` → `render`
    input.tsx         # Base UI Input
    form.tsx          # FormProvider, FormField, FormItem, FormControl, FormLabel, Message
    sonner.tsx
    label (inline)    # Native <label> (Base UI has no separate label pkg)
lib/utils.ts          # cn() — clsx + tailwind-merge
.vscode/
  settings.json       # formatOnSave, defaultFormatter prettier, tailwindCSS config
  extensions.json     # recommends bradlc.vscode-tailwindcss
```

## Notable Modernization vs Tutorial (1 year old)

- **Tailwind v4** — use `@import "tw-animate-css"` not `@plugin "tailwindcss-animate"` (`app/globals.css:2`)
- **shadcn base-nova** — Button uses `@base-ui/react` `render` prop, not Radix `asChild`/`Slot`. `components/ui/button.tsx` maps `asChild` → `render` for compatibility
- **Form** — `components/ui/form.tsx` is not shipped by `shadcn add` in v4; created manually. Import from `@/components/ui/form` not `input`
- **Zod 4** — `z.string().email()` deprecated → `z.email()` (`components/AuthForm.tsx:17`)
- **Generic FormField** — `const FormField = <T extends FieldValues>(props: FormFieldProps<T>)` required
- **next/image** — SVG needs `unoptimized` + `style={{width:"auto",height:"auto"}}` to avoid aspect-ratio warning; same for `robot.png`

## Scripts

| Script          | What                                         |
| --------------- | -------------------------------------------- |
| `npm run dev`   | `next dev` with Turbopack                    |
| `npm run build` | `next build`                                 |
| `npm run lint`  | `eslint` (next/core-web-vitals + typescript) |

## VS Code

Recommended extensions auto-prompt from `.vscode/extensions.json`:

- `bradlc.vscode-tailwindcss` — IntelliSense for Tailwind v4
- `esbenp.prettier-vscode` — formatter (already set as `editor.defaultFormatter`)

Prettier sorts Tailwind classes on save via `prettier-plugin-tailwindcss` (`tailwindStylesheet: ./app/globals.css`).

## Roadmap

- [ ] Firebase Auth + Firestore
- [ ] Vapi voice interview `app/(root)/interview/[id]/page.tsx`
- [ ] Gemini feedback generation (Server Actions)
- [ ] Dashboard history `interviews-section`

## License

MIT — tutorial code for learning.
