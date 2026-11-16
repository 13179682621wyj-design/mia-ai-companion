# MIA 3.0 — My Insight Assistant

A standalone responsive interactive prototype with a Gemini-powered multi-turn decision companion, reflective tarot, mood journal, and local conversation history.

## Deploy on the existing Vercel project

1. Back up the current GitHub repository first (download ZIP or create a branch).
2. Replace the root `index.html`, `api/chat.js`, and `package.json` in the existing repository with these files. Keep the same paths, **not** an extra `mia-3.0/` directory.
3. Commit to the repository's default branch; Vercel will redeploy automatically.
4. Ensure the Vercel production environment has `GEMINI_API_KEY`. Do not put the key in code or GitHub.
5. Test the public URL on desktop and mobile.

The local `index.html` can be opened directly for visual preview. AI requires the deployed `/api/chat` endpoint.

## Scope / limitations

- Multi-turn conversations are sent as a bounded recent history (12 messages). Full records are kept in the same browser's localStorage, up to 20 sessions. This is not account-based cloud sync.
- Tarot is a random reflective prompt, not prediction.
- Gemini free API requests may be rate-limited; a public demo shares the project quota. Add server-side rate limits and bot protection before promoting widely.
- This is a UX prototype, not a clinical or therapeutic product.
- Do not enter sensitive personal data in a public demo. Google's API data practices depend on the billing tier and terms.
