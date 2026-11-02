# MouthOS Clinical Atlas

A dental photo assessment and semantic search app. Google Gemini describes visible photo findings and possible causes, while Supabase pgvector retrieves related textbook passages with page-level references. Text-only search is also supported.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · lucide-react · `@google/genai` · `@supabase/supabase-js`

---

## Getting started

```bash
npm install
cp .env.local.example .env.local # then fill in the values
npm run dev # http://localhost:3000
```

## Photo search

Use Upload photo for a gallery image, or Take photo for mobile camera capture
(the browser/device determines camera availability). Add optional symptoms in the
search field, then select Search. JPEG, PNG and WebP inputs up to 20 MB are
prepared in the browser as JPEGs, up to 2000 pixels along the longest edge.
The API accepts at most 3 MB per photo, below Vercel's request limit.
HEIC files must first be exported as JPEG.

The server sends the photo to Gemini and returns visible findings, possible
causes and their reasoning, suggested next steps, and limitations. These are
tentative AI observations, not a diagnosis. Blurry or unrelated images should
request a better photo. Related textbook passages are retrieved using the
existing Supabase `match_clinical_pages` RPC; they do not verify the assessment.
An atlas outage does not discard a successful assessment.

MouthOS does not persist uploaded photos, assessment history, or clinical
context. Photos are sent to Google for processing, subject to the API account's
terms and data settings. Do not upload identifying details or photos without
permission. No Supabase schema change or storage bucket is required.

## Vercel configuration

Keep `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and
`NEXT_PUBLIC_SUPABASE_URL` set in Vercel. The optional `GEMINI_VISION_MODEL`
defaults to `gemini-3.5-flash`; the configured key must have access to that model.
Photo assessment has a 60-second function duration and bounded upstream
timeouts. Existing text search remains at `/api/search`; multipart photo
requests use `/api/image-search` with `image` and optional `query` fields.
Neither API key nor the Supabase service-role key is sent to the browser.

## Validation and deployment

```powershell
npm run typecheck
npx eslint app components lib --max-warnings 0
npm run build
# With the app running in another terminal:
node scripts/test-search.mjs
# Optional live provider smoke tests (uses your configured API account):
$env:TEST_LIVE="1"; node scripts/test-search.mjs
```

Push the changes, then redeploy the GitHub commit manually in Vercel:

```powershell
git add app/page.tsx app/api/search/route.ts app/api/image-search/route.ts components/PhotoInput.tsx components/PhotoAssessment.tsx lib/types.ts lib/image-upload.ts scripts/test-search.mjs .env.local.example README.md
git commit -m "Add dental photo search and AI assessment"
git push origin main
```
