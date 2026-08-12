# LockedIn

A small browser extension that keeps LinkedIn focused on job hunting. Visits to
LinkedIn's `/feed` route are redirected to `/jobs`, including client-side
navigation inside LinkedIn.

The popup shows whether LockedIn is active on the current LinkedIn tab or idle
on another site.

## Development

```sh
pnpm install
pnpm dev
```

Run `pnpm compile` and `pnpm build` before shipping a change.
