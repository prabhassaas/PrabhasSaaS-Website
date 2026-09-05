# Prabhas SaaS — shared app top bar

Every Prabhas app wears the same top bar. It is the one piece of chrome that
tells a customer the app they are in belongs to the same family as the others,
so its structure does not vary between apps. What *does* vary is the app's own
identity inside it: logo, accent colour, nav links, primary action.

**This applies to new apps too.** When you build the next app, copy the three
files below before you design a header of your own.

## Files

| File | Purpose |
| --- | --- |
| `shared/pss-topbar.css` | All styling. Namespaced `.pss-*`, safe to drop into an app that already has its own CSS. |
| `shared/pss-topbar.js` | Behaviour only: dropdowns, mobile menu, signed-in swap. |
| `shared/pss-topbar.html` | The canonical markup to copy into the app. |

Copy all three into the app repo. Don't hotlink them across domains — an app
should not break because another host is down.

## Where it goes

On the app's **marketing / landing surface** — the page a logged-out visitor
lands on. Full-screen working surfaces (the Dastavej editor canvas, the Shilp3D
drawing view) keep their own tool chrome; forcing a marketing bar onto them
costs the user vertical space they need.

## Anatomy

Fixed left-to-right order, 64px tall, sticky, white, hairline bottom border:

1. **`Prabhas SaaS` home link** — small, grey, house icon, vertical divider after
   it. Hidden below 768px. This is the family badge; every app has it and it
   always points at `prabhassaas.in`.
2. **App identity** — 32px rounded tile in the app's accent holding the app's
   logo mark, then the app's name in the accent colour.
3. **App nav** — the app's own links. 14px, grey, accent on hover.
4. **Actions**, right-aligned:
   - *Signed out:* `Sign in` text link + the app's primary CTA. An app with no
     account concept at all (Dastavej) omits the sign-in link and keeps the CTA
     — offering a login that doesn't exist is worse than the small asymmetry.
   - *Signed in:* app switcher pill → user menu → primary CTA.
5. **Hamburger** below 768px, opening the same links stacked.

## Customising

Only these change per app. Everything else stays byte-identical.

```html
<header class="pss-topbar" style="--pss-accent:#7A1F2B">
```

| Token | Meaning |
| --- | --- |
| `--pss-accent` | The app's brand colour. Used by the logo tile, app name, nav hover, avatar and CTA. |
| `--pss-accent-ink` | Text/icon colour on the accent. Defaults to white; set it if your accent is light. |

Current accents: Seedha Bill `#7A1F2B` · Lekhya AI `#1B2A4A` ·
Dastavej `#6366f1` · Shilp3D `#0369a1` · Desk `#4150B5`.

Use `class="pss-cta pss-cta--saffron"` for trial/growth CTAs, so "start a trial"
reads the same saffron in every app regardless of the app's own accent.

### The logo tile

Default is a **single-colour glyph on the accent plate** — Lekhya's chart,
Seedha Bill's invoice, Shilp3D's triangle. A 32px tile is small, so a stacked
wordmark lockup will not read; give the app a square glyph mark if it lacks one.

If the mark already carries its own background (Dastavej's is a gradient tile
with the glyph inside), add `pss-brand__mark--bare` / `pss-switch__mark--bare`
so it isn't placed on a second plate.

### Dark mode

The bar has a dark palette that activates from a `.dark` ancestor — the
class-based convention these apps use. It is deliberately *not* wired to
`prefers-color-scheme`, because an app with its own theme toggle would
otherwise show a dark bar to someone who chose light. Apps with no dark mode
need do nothing.

## Auth

The bar renders signed-out and stays that way unless something tells it
otherwise — which is the correct resting state for an app without login, and
means an app never has to strip parts out.

If the page loads `pss-auth.js`, the bar picks the session up on its own. An app
that resolves auth its own way can push a user in:

```js
window.PSSTopbar.setUser({ name: "Anita Rao", email: "anita@example.com" });
```

Elements marked `data-pss-when="out"` hide and `data-pss-when="in"` show. The
avatar's initials, first name, full name and email fill in automatically.

## Things that are deliberate

- **The app switcher lists every app, including the current one.** The JS drops
  the duplicate at runtime. Do not hand-edit the list per app — it will drift
  the day a new app ships.
- **`[hidden]` is pinned with `!important`** inside the bar. Several of these
  apps set `display` on bare class selectors, which otherwise outranks the
  browser's `[hidden]` rule and leaves signed-in controls visible to logged-out
  visitors.
- **Markup is server-rendered, not injected by JS.** No flash of missing header,
  no layout shift, and the nav links are in the DOM for crawlers.
- **The CSS neutralises host styles on the elements it owns.** Several of these
  apps style bare element selectors — SeedhaBill gives every `nav` a sticky
  translucent bar with a bottom rule, which otherwise lands on the top bar's own
  inner `<nav>`. If a new app's own CSS still bleeds through, add the offending
  property to that block rather than patching it in the app.

## React / Next apps

Don't load `pss-topbar.js` into a React tree — it would mutate DOM that React
owns. Port the markup to a component and hold the dropdown state in React
instead; `components/PssTopBar.tsx` in the Dastavej repo is the reference.
Keep the same class names so the shared stylesheet still applies.
