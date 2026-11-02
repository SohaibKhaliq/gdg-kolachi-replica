# GDG Kolachi homepage — replica (v3)

Static HTML/CSS/JS replica of the GDG Kolachi homepage: same section order,
dark theme, Google-palette accents, exact fonts (Plus Jakarta Sans headings,
DM Sans body, both free Google Fonts), the chapter's own visual assets, and
the animations rebuilt from a live scroll-through study of the original:
five full-screen hero panels sliding up, a JS dot grid whose dots glow in
Google colours near the cursor (with a centre hole for the bracket mark),
fast word-by-word mission brightening, a 3D rotating box with opening flaps
and a five-card fan, a fixed-colour audience cycle with centre brightness,
and row-wise team brightening.

## Assets and authorization

The visual assets in `assets/` (GDG logo, partner logos, flagship box and
card art, hero photos, curated-moments photos, team photos, favicons) are
the chapter's own assets, used here with authorization stated by the site
owner (who confirmed he is authorized by GDG Kolachi). This is a replica
build, not the official site — the official site is https://gdgkolachi.com/.

## Notes

- Hero: each of the five phrases has its own background photo, as on the
  original (ARB_2490, ARB_5647, ARB_7280, ARB_8095, DSC_0222); the first
  slide carries the subtitle from the original's code.
- Partner logos use the original's own treatment: 28px tall, brightness-0
  invert, 60% opacity.
- The box uses the real face art: front (Kolachi oval), back (Flagship
  Events band), left/right (vertical "Google Developer Group"), lid flaps.
- v3 files are named `styles.v3.css` / `script.v3.js` so browsers cannot
  serve cached v2 files; the v2 files remain in the repo for old cached
  pages.
