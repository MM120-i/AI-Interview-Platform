# Tests

All tests live in `tests/` — **not** in `app/` — so we don't touch any of the 6 phases you asked to leave alone.

## Stack

- **Runner:** `vitest@3` + `jsdom` (configured in `vitest.config.ts:1` with `path` alias `@` → `./`)
- **UI:** `@testing-library/react` + `@testing-library/jest-dom` + `user-event`
- **Setup:** `tests/setup.ts:1` mocks `next/image`, `next/link`, `next/navigation`, `next/font/google`, `sonner`

## Structure

```
tests/
  setup.ts
  lib/utils.test.ts                    # cn, getTechLogos, getRandomInterviewCover (deterministic, hydration-safe)
  components/
    Button.test.tsx                    # variants, asChild → Base UI render
    DisplayTechIcons.test.tsx          # slicing, fallback /tech.svg, overlapping
    FormField.test.tsx                 # react-hook-form + zodResolver
    InterviewCard.test.tsx             # deterministic cover, date, links
    AuthForm.test.tsx                  # sign-in vs sign-up, zod, router push
  api/
    vapi-generate.test.ts              # BodySchema, groq primary → compound fallback, parseQuestions
    realtime-session.test.ts           # OPENAI_API_KEY, Sarah intro, Authorization header
  firebase/
    admin.test.ts                      # resilient init when env missing
    auth-actions.test.ts               # getCurrentUser, isAuthenticated, signUp/signIn mocked
```

## Run

```bash
npm test          # vitest run (not added to package.json scripts — run via npx)
npx vitest run
npx vitest --watch
npx vitest --coverage
```

## Coverage of existing code

- `lib/utils.ts:26` `cn` (tailwind-merge dedup)
- `lib/utils.ts:12` `getTechLogos` (mappings, fallback, case insensitivity)
- `lib/utils.ts:30` `getRandomInterviewCover` (deterministic hash, hydration)
- `components/ui/button.tsx:44` `Button` + `buttonVariants`
- `components/DisplayTechIcons.tsx:4` `techStack` prop, slicing
- `components/InterviewCard.tsx:11` `normalizedTypes`, `formattedDate`, `coverSrc`
- `components/AuthForm.tsx:17` `AuthFormSchema` (`z.email()`), `onSubmit` routing
- `app/api/vapi/generate/route.ts:7` `BodySchema` + fallback
- `app/api/realtime/session/route.ts:1` session mint
- `firebase/admin.ts:5` resilient init
- `lib/actions/auth.action.ts:92` auth actions with mocked `firebase/admin` + `next/headers` cookies
```

