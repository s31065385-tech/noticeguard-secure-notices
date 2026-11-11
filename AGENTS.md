<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## NoticeGuard architecture

- All data access goes through the `NoticeGuardApi` interface in `src/lib/api`; `VITE_NOTICEGUARD_API_URL` selects the FastAPI adapter, otherwise the IndexedDB demo adapter — so the UI never changes when the backend is connected.
- The FastAPI contract lives in `docs/fastapi-integration.md`; keep `src/lib/api/backend.ts` and that doc in sync.
- QR access and signature verification stay separate code paths: opening a notice by QR must never set or imply a verified state — verification only runs from an explicit user action.
- Demo-mode results carry `simulated: true` and must be visibly labelled; never present them as production proof.
- Crypto uses Web Crypto (SHA-256, ECDSA P-256) in `src/lib/crypto.ts`; it is covered by `src/lib/crypto.test.ts` (node environment, since jsdom lacks SubtleCrypto).
- Routes that read browser storage (IndexedDB/sessionStorage) set `ssr: false`.
