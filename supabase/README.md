# Supabase project notes

The live Supabase project (`eduresearch-supabase`, ref `axeiiugncguxgeydkaew`,
region `ap-southeast-1`) was created and migrated via the Supabase MCP tool's
`create_project`/`apply_migration` calls, **not** the Supabase CLI
(`supabase init` / `link` / `db push`). As a result there is no local
`supabase/config.toml` or CLI project link in this repo.

The SQL files in `migrations/` are kept in version control to match what
was actually applied live, and are safe to re-apply (via the CLI's
`supabase db push` after running `supabase link --project-ref
axeiiugncguxgeydkaew`, or via the MCP tool again) against a fresh project
if this one is ever recreated.
