# LockedIn

A small browser extension that keeps LinkedIn focused on job hunting. Visits to
LinkedIn's `/feed` route are redirected to `/jobs`, including client-side
navigation inside LinkedIn.

The popup shows whether LockedIn is active on the current LinkedIn tab or idle
on another site, along with the number of feeds redirected since installation.
After a successful redirect, the extension's toolbar badge briefly displays
“LOCK” and a native “LOCK IN!” notification is shown, without injecting
anything into the LinkedIn page. Native notifications are optional and can be
enabled or disabled from the popup.

On first installation, LockedIn opens a welcome page explaining how to pin its
toolbar icon so the LOCK badge stays visible.

LockedIn is an independent extension and is not affiliated with or endorsed by
LinkedIn. Redirect counts are kept locally and exclude private-browsing
sessions.

The extension observes URL changes only for LinkedIn through its LinkedIn host
permission; it does not request access to browser history.

## Development

```sh
pnpm install
pnpm dev
```

LockedIn strips WXT's development-only `tabs` permission because this project
has no content scripts. The generated development and production manifests do
not request browser-history access.

Run `pnpm compile` and `pnpm build` before shipping a change.

## GitHub Pages privacy policy

The static site in `docs/` is generated from the same React privacy-policy
component used by the extension. Regenerate it after changing the policy,
styles, fonts, or third-party notices:

```sh
pnpm run docs
```

The explicit `run` is required because `pnpm docs` is pnpm's built-in command
for opening a dependency's documentation.
