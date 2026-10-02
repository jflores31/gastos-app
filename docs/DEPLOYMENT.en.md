# Deployment and versions

🌐 [Español](DEPLOYMENT.md) · **English**

How a change is published, how versions work and what to check when something fails only in production.

## Deployment

- The GitHub → Vercel integration deploys every push to `main` to production and creates a **preview** for every PR.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build and the end-to-end tests on every PR; only merge when it's green.
- If a change touches the schema, first run `supabase/schema.sql` in the Supabase SQL Editor (see [DATABASE.en.md](DATABASE.en.md#install-or-upgrade)). It's idempotent: it only adds what's missing.
- Manual deploy: `vercel --prod`. Environment variables are configured in the Vercel Dashboard.
- **Speed Insights** (real-user performance: LCP, INP, CLS…):
  - **Where it's mounted:** `<SpeedInsights />` in `src/app/layout.tsx`, only when `VERCEL` is set, that is, on Vercel deployments. It isn't mounted locally or in CI.
  - **Turning it on:** in the Vercel project, **Speed Insights** tab → **Enable**. Until then, the `/_vercel/speed-insights/script.js` script returns 404 and nothing is measured.
  - **CSP:** how it fits, in [SECURITY-CSP.md](SECURITY-CSP.md#scripts-de-terceros-vercel-speed-insights) (Spanish).

## How to merge a PR

Merging into `main` ships the change to production. The steps, on the PR's page on GitHub:

1. **Review:** the *Files changed* tab shows the diff. The Vercel preview (linked from the PR's checks) lets you try the change with real data before merging.
2. **Wait for green CI:** the *CI* check on the latest commit must show ✓.
3. **Upgrade the DB if needed:** if the PR changes `supabase/schema.sql`, run the whole file in the Supabase SQL Editor **before** merging. It's idempotent, so it doesn't matter if some of the changes were already there.
4. **Take it out of draft:** a *Draft* PR can't be merged. Click **Ready for review** at the bottom of the PR conversation.
5. **Merge:** **Merge pull request** → **Confirm merge**. Vercel deploys `main` within a minute or two.
6. **Optional:** **Delete branch** removes the PR's branch.

From the terminal, with [GitHub CLI](https://cli.github.com/): `gh pr ready <number>`, then `gh pr merge <number> --merge`.

## Versions and releases

- **Where the version lives:**
  - in `package.json`;
  - in the **Version** line of both READMEs;
  - in [`CHANGELOG.md`](../CHANGELOG.md). Each change is noted under `## [Unreleased]` until a version is published.
- **History:** numbering restarted at `0.0.1`, and the `v1.x` history (tags and releases) was discarded.
- **Publishing a version** (e.g. `0.0.2`):
  1. On a branch:
     - `npm version 0.0.2 --no-git-tag-version`, which updates `package.json` and `package-lock.json`;
     - in the CHANGELOG, rename `## [Unreleased]` to `## [0.0.2]`;
     - update the **Version** line in both READMEs.
  2. Open the PR and merge it.
  3. On GitHub, go to **Releases** → **Draft a new release**:
     - tag `v0.0.2` on `main` (the tag is created when you publish);
     - title `v0.0.2`;
     - for the notes, that version's section of the CHANGELOG;
     - **Publish release**.
- **Deleting a release:** in **Releases**, open the release and click the trash icon (**Delete**).
  - Deleting a release **does not delete its tag**. Delete the tag separately, from the **Tags** tab or with `git push origin --delete vX.Y.Z`.
  - If you delete the tag first, the release doesn't go away: it becomes a draft, and you still have to delete it.

## Troubleshooting

**A feature appears "broken" only in production (www.jeshu.cfd) but works locally.**
This is almost always **browser cache**: after a deployment, the browser can combine stale cached HTML with the new JavaScript chunks, running a mix of versions. The app **does not use a Service Worker or PWA**, so there is no app-level cache to clear — it's the browser's.

- **Fix:** hard refresh with `Ctrl + Shift + R` (Cmd + Shift + R on Mac) or open the site in an **incognito window**.
- Before hunting for the bug in code, confirm the symptom also reproduces **locally** (`npm run dev`) and in **incognito**. If it only happens in production and your local code matches `origin/main`, it's cache.
- Real case (2026-06-16): the calendar date filter (Expenses/Income) showed the chip with the selected date but left the list empty, only in production. The code was correct; a hard refresh fixed it.
