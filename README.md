# armaan.bond

Static hub site (no framework, no build step). Deploy to GitHub Pages and point the `armaan.bond` custom domain at it (add a `CNAME` file containing `armaan.bond`).

- `assets/js/projects.js` — central config: `siteConfig`, `socials`, `projects`, `services`. Add an object and the UI updates. Empty social URLs are hidden.
- `assets/js/tools.js` — tool registry. Set `available: true` only for tools that really work.
- `assets/js/components-v2.js` — Discord Components V2 builder (client-side only; output is generated from live state).
- `assets/images/og-image.png` — 1200x630 social preview.

Status badges: services are `PLANNED` unless they exist. Change to `ACTIVE` when live. No stats or uptime are displayed.

## Discord link previews
Discord builds link embeds from the Open Graph tags in the page's raw HTML (already in `index.html`), and `theme-color` sets the embed stripe colour. `oembed.json` adds author/provider text. Discord caches previews, so after changes test with a new URL variant such as `https://armaan.bond/?v=2` or a fresh channel. The "Discord Link Preview Meta" tool generates tags for other pages.

## Component link embed (`discord:component-embed`)
`index.html` carries a `<script id="discord:component-embed" type="application/json">` block (between `DISCORD-EMBED:START/END` comments) holding one Container component. The builder's **HTML Embed** tab generates this block from your current layout. Keep it in the raw HTML `<head>`, link buttons only (no `custom_id`), and absolute https URLs. Note: this follows the format supplied by the site owner; Discord's public docs do not describe it.
