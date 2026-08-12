# LockedIn

A small browser extension that keeps LinkedIn focused on job hunting. Visits to
LinkedIn's `/feed` route are redirected to `/jobs`, including client-side
navigation inside LinkedIn.

The popup shows whether LockedIn is active on the current LinkedIn tab or idle
on another site, along with the number of feeds redirected since installation.
After a successful redirect, the extension's toolbar badge briefly displays
“LOCK” without injecting anything into the LinkedIn page.

LockedIn is an independent extension and is not affiliated with or endorsed by
LinkedIn. Redirect counts are kept locally and exclude private-browsing
sessions.

## Development

```sh
pnpm install
pnpm dev
```

Run `pnpm compile` and `pnpm build` before shipping a change.
