window.initBuilder = () => {
  const $ = s => document.querySelector(s), el = window.el, safeUrl = window.safeUrl;
  const TYPES = { text: "Text Display", section: "Section", thumb: "Thumbnail", link: "Link Preview", sep: "Separator", gallery: "Media Gallery", row: "Action Row" };
  const STYLES = { 1: "Primary", 2: "Secondary", 3: "Success", 4: "Danger", 5: "Link" };
  const mk = {
    text: () => ({ t: "text", content: "## Hello from ARMAAN.BOND\nEdit **this text**." }),
    section: () => ({ t: "section", content: "Section text next to a button.", acc: "button", label: "Open", style: 5, url: "https://armaan.bond", img: "" }),
    thumb: () => ({ t: "section", content: "Section text next to a thumbnail.", acc: "thumb", label: "", style: 1, url: "", img: "https://armaan.bond/assets/images/og-image.png" }),
    link: () => ({ t: "link", title: "ARMAAN.BOND", description: "Projects, tools, APIs and experiments in one developer ecosystem.", site: "armaan.bond", url: "https://armaan.bond", img: "https://armaan.bond/assets/images/og-image.png", label: "Open site" }),
    sep: () => ({ t: "sep", divider: true, spacing: 1 }),
    gallery: () => ({ t: "gallery", urls: "https://armaan.bond/assets/images/og-image.png" }),
    row: () => ({ t: "row", btns: [{ label: "Docs", style: 5, url: "https://armaan.bond" }, { label: "Confirm", style: 3, url: "" }] })
  };
  const initial = () => ({ wrap: true, color: "#06B6D4", items: [mk.text(), mk.row()] });
  let S = initial(), fmt = "JSON";
  const idx = i => i + 1;

  // ---- state -> payload
  function build() {
    const errors = [], out = []; let n = 0;
    const url = (u, where, req = true) => { if (!u) { if (req) errors.push(`${where}: URL is empty.`); return null; } const s = safeUrl(u); if (!s) errors.push(`${where}: "${u}" is not a valid http(s) URL.`); return s; };
    const ids = new Set();
    const ex = (o, b) => { if (b.emoji && b.emoji.trim()) o.emoji = { name: b.emoji.trim() }; if (b.disabled) o.disabled = true; return o; };
    const btn = (b, where) => {
      if (!b.label.trim()) errors.push(`${where}: button label is empty.`);
      if (b.label.length > 80) errors.push(`${where}: label is over 80 characters.`);
      if (+b.style === 5) { const u = url(b.url, where + " (link button)"); return ex({ type: 2, style: 5, label: b.label, url: u || b.url }, b); }
      const cid = (b.cid || "").trim() || "btn_" + (++n);
      if (cid.length > 100) errors.push(`${where}: custom ID is over 100 characters.`);
      if (ids.has(cid)) errors.push(`${where}: custom ID "${cid}" is used twice; each must be unique.`); ids.add(cid);
      return ex({ type: 2, style: +b.style, label: b.label, custom_id: cid }, b);
    };
    S.items.forEach((c, i) => {
      const w = `#${idx(i)} ${TYPES[c.t === "section" && c.acc === "thumb" ? "thumb" : c.t]}`;
      if (c.t === "text") { if (!c.content.trim()) errors.push(`${w}: text is empty — Discord rejects empty text displays.`); out.push({ type: 10, content: c.content }); }
      else if (c.t === "section") {
        if (!c.content.trim()) errors.push(`${w}: section text is empty.`);
        const acc = c.acc === "thumb" ? { type: 11, media: { url: url(c.img, w) || c.img } } : btn(c, w);
        out.push({ type: 9, components: [{ type: 10, content: c.content }], accessory: acc });
      }
      else if (c.t === "link") {
        if (!c.title.trim()) errors.push(`${w}: title is empty.`);
        const u = url(c.url, w + " page");
        out.push({ type: 10, content: `### [${c.title}](${u || c.url})` + (c.description ? "\n" + c.description : "") + (c.site ? "\n-# " + c.site : "") });
        if (c.img.trim()) out.push({ type: 12, items: [{ media: { url: url(c.img, w + " image") || c.img } }] });
        out.push({ type: 1, components: [{ type: 2, style: 5, label: c.label || "Open", url: u || c.url }] });
      }
      else if (c.t === "sep") out.push({ type: 14, divider: !!c.divider, spacing: +c.spacing });
      else if (c.t === "gallery") {
        const ls = c.urls.split("\n").map(x => x.trim()).filter(Boolean);
        if (!ls.length) errors.push(`${w}: add at least one image URL (one per line).`);
        if (ls.length > 10) errors.push(`${w}: Discord allows at most 10 gallery items (you have ${ls.length}).`);
        out.push({ type: 12, items: ls.map(u => ({ media: { url: url(u, w) || u } })) });
      }
      else if (c.t === "row") {
        if (!c.btns.length) errors.push(`${w}: an Action Row needs at least one button.`);
        out.push({ type: 1, components: c.btns.map((b, j) => btn(b, `${w} button ${j + 1}`)) });
      }
    });
    if (!out.length) errors.push("The message is empty. Add at least one component.");
    const comps = S.wrap && out.length ? [{ type: 17, accent_color: parseInt(S.color.slice(1), 16), components: out }] : out;
    const total = (JSON.stringify(comps).match(/"type":/g) || []).length;
    if (total > 40) errors.push(`Discord allows at most 40 components per message; this one has ${total}.`);
    return { msg: { flags: 32768, components: comps }, errors };
  }

  // ---- serialisers
  const py = (v, d = 0) => { const p = "    ".repeat(d + 1), e = "    ".repeat(d);
    if (v === null) return "None"; if (v === true) return "True"; if (v === false) return "False";
    if (typeof v === "string") return JSON.stringify(v); if (typeof v === "number") return String(v);
    if (Array.isArray(v)) return v.length ? "[\n" + v.map(x => p + py(x, d + 1)).join(",\n") + "\n" + e + "]" : "[]";
    return "{\n" + Object.entries(v).map(([k, x]) => p + JSON.stringify(k) + ": " + py(x, d + 1)).join(",\n") + "\n" + e + "}"; };
  const htmlEmbed = m => {
    const c = m.components.length === 1 && m.components[0].type === 17 ? m.components[0] : { type: 17, components: m.components };
    const json = JSON.stringify({ component: c }).replace(/</g, "\\u003c");
    return `<!-- Paste inside <head> of your page's raw HTML (not injected by JavaScript). -->\n<!-- DISCORD-EMBED:START -->\n<script id="discord:component-embed" type="application/json">${json}</script>\n<!-- DISCORD-EMBED:END -->`;
  };
  const gen = m => fmt === "HTML Embed" ? htmlEmbed(m) : fmt === "JSON" ? JSON.stringify(m, null, 2)
    : fmt === "JavaScript" ? `// flags: 32768 = MessageFlags.IsComponentsV2 (discord.js v14.19+)\nconst message = ${JSON.stringify(m, null, 2)};\n\nawait channel.send(message);`
    : `# flags: 32768 = IS_COMPONENTS_V2. Send as a raw payload with the REST API.\nimport os, requests\n\nmessage = ${py(m)}\n\nrequests.post(\n    f"https://discord.com/api/v10/channels/{CHANNEL_ID}/messages",\n    headers={"Authorization": "Bot " + os.environ["DISCORD_TOKEN"]},\n    json=message,\n)`;

  // lightweight highlighter (DOM-built, no innerHTML)
  const hl = (pre, text) => { pre.replaceChildren(); const re = /("(?:[^"\\\n]|\\.)*")|\b(true|false|null|True|False|None|const|await|import)\b|(-?\b\d+\b)|(\/\/.*|#.*)/g; let last = 0, m;
    while ((m = re.exec(text))) { pre.append(text.slice(last, m.index)); const s = el("span", m[1] ? "s" : m[2] ? "k" : m[3] ? "n" : "c", m[0]); pre.append(s); last = re.lastIndex; }
    pre.append(text.slice(last)); };

  // ---- preview
  const BC = { 1: "b1", 2: "b2", 3: "b3", 4: "b4", 5: "b2" };
  const pbtn = b => el("span", "dbtn " + BC[b.style] + (b.disabled ? " dis" : ""), (b.emoji ? b.emoji + " " : "") + (b.label || "(empty)") + (+b.style === 5 ? " ↗" : ""));
  const ptext = t => { const d = el("div", "dtxt"); t.split("\n").forEach((ln, i) => { const h = ln.match(/^(#{1,3})\s+(.*)/); const line = el(h ? "strong" : "div", h ? "dh" : "", h ? h[2] : ln); d.append(line); }); return d; };
  const pimg = u => { const s = safeUrl(u); if (!s) return el("span", "dimg ph", "image"); const i = el("img", "dimg"); i.alt = ""; i.loading = "lazy"; i.referrerPolicy = "no-referrer"; i.src = s; return i; };
  function preview() {
    const box = $("#preview"), body = el("div", "dbody");
    S.items.forEach(c => { let n;
      if (c.t === "text") n = ptext(c.content);
      else if (c.t === "section") { n = el("div", "dsec"); n.append(ptext(c.content)); n.append(c.acc === "thumb" ? pimg(c.img) : pbtn(c)); }
      else if (c.t === "link") { n = el("div", "dlink"); n.append(el("div", "dsite", c.site || ""), el("strong", "dh dlt", c.title), el("div", "", c.description)); if (c.img.trim()) { const i = pimg(c.img); i.classList.add("big"); n.append(i); } const r = el("div", "drow"); r.append(pbtn({ label: c.label || "Open", style: 5 })); n.append(r); }
      else if (c.t === "sep") { n = el("div", "dsep sp" + c.spacing); if (c.divider) n.append(el("hr")); }
      else if (c.t === "gallery") { n = el("div", "dgal"); c.urls.split("\n").map(x => x.trim()).filter(Boolean).slice(0, 10).forEach(u => n.append(pimg(u))); }
      else { n = el("div", "drow"); c.btns.forEach(b => n.append(pbtn(b))); }
      n.classList.add("pin"); body.append(n); });
    const card = S.wrap ? el("div", "dcont") : el("div", "dplain"); if (S.wrap) card.style.borderLeftColor = S.color;
    card.append(body);
    const head = el("div", "dhead"); head.append(el("span", "av", "A"), el("b", "", "ARMAAN"), el("span", "tag", "Developer"), el("span", "sim", "SIMULATION"));
    box.replaceChildren(head, card);
  }
  function refresh() {
    const { msg, errors } = build(), e = $("#errs"); e.replaceChildren(); errors.forEach(x => e.append(el("li", "", x)));
    hl($("#code"), gen(msg)); preview(); $("#accRow").hidden = !S.wrap;
  }

  // ---- editor
  const field = (label, node) => { const l = el("label", "fld"); l.append(el("span", "", label), node); return l; };
  const inp = (val, on, type = "text") => { const i = el("input"); i.type = type; i.value = val; i.addEventListener("input", () => { on(i.value); refresh(); }); return i; };
  const area = (val, on, rows = 3) => { const a = el("textarea"); a.rows = rows; a.value = val; a.spellcheck = false; a.addEventListener("input", () => { on(a.value); refresh(); }); return a; };
  const sel = (opts, val, on) => { const s = el("select"); for (const [k, v] of Object.entries(opts)) { const o = el("option", "", v); o.value = k; s.append(o); } s.value = val; s.addEventListener("change", () => { on(s.value); renderEditor(); refresh(); }); return s; };
  const chk = (val, on) => { const c = el("input"); c.type = "checkbox"; c.checked = !!val; c.addEventListener("change", () => { on(c.checked); refresh(); }); return c; };
  const btnFields = (b, host) => { host.append(field("Label", inp(b.label, v => b.label = v)), field("Emoji (optional, unicode)", inp(b.emoji || "", v => b.emoji = v)), field("Style", sel(STYLES, b.style, v => { b.style = +v; })));
    host.append(+b.style === 5 ? field("Link URL", inp(b.url, v => b.url = v, "url")) : field("Custom ID (optional)", inp(b.cid || "", v => b.cid = v)));
    host.append(field("Disabled", chk(b.disabled, v => b.disabled = v))); };
  function renderEditor() {
    const box = $("#items"); box.replaceChildren();
    if (!S.items.length) box.append(el("p", "muted", "No components yet. Use the + buttons above."));
    S.items.forEach((c, i) => {
      const card = el("div", "ic"), head = el("div", "ic-h"), name = TYPES[c.t === "section" && c.acc === "thumb" ? "thumb" : c.t];
      head.append(el("b", "", `${idx(i)}. ${name}`));
      const tools = el("div", "ic-t");
      [["↑", "Move up", () => i > 0 && ([S.items[i - 1], S.items[i]] = [S.items[i], S.items[i - 1]])], ["↓", "Move down", () => i < S.items.length - 1 && ([S.items[i + 1], S.items[i]] = [S.items[i], S.items[i + 1]])],
       ["⧉", "Duplicate", () => S.items.splice(i + 1, 0, JSON.parse(JSON.stringify(c)))], ["✕", "Remove", () => S.items.splice(i, 1)]].forEach(([g, label, fn]) => {
        const b = el("button", "ib", g); b.setAttribute("aria-label", `${label} component ${idx(i)}`); b.title = label; b.addEventListener("click", () => { fn(); renderEditor(); refresh(); }); tools.append(b); });
      head.append(tools); card.append(head);
      const f = el("div", "ic-f");
      if (c.t === "text") f.append(field("Text (markdown)", area(c.content, v => c.content = v, 4)));
      else if (c.t === "link") f.append(field("Title", inp(c.title, v => c.title = v)), field("Description", area(c.description, v => c.description = v)), field("Site name (small text)", inp(c.site, v => c.site = v)), field("Page URL", inp(c.url, v => c.url = v, "url")), field("Image URL (optional)", inp(c.img, v => c.img = v, "url")), field("Button label", inp(c.label, v => c.label = v)));
      else if (c.t === "section") { f.append(field("Text", area(c.content, v => c.content = v)), field("Accessory", sel({ button: "Button", thumb: "Thumbnail" }, c.acc, v => c.acc = v)));
        if (c.acc === "thumb") f.append(field("Thumbnail image URL", inp(c.img, v => c.img = v, "url"))); else btnFields(c, f); }
      else if (c.t === "sep") { const cb = el("input"); cb.type = "checkbox"; cb.checked = c.divider; cb.addEventListener("change", () => { c.divider = cb.checked; refresh(); });
        f.append(field("Show divider line", cb), field("Spacing", sel({ 1: "Small", 2: "Large" }, c.spacing, v => c.spacing = +v))); }
      else if (c.t === "gallery") f.append(field("Image URLs (one per line, max 10)", area(c.urls, v => c.urls = v, 3)));
      else { c.btns.forEach((b, j) => { const r = el("div", "brow"); btnFields(b, r); const x = el("button", "btn sm", "Remove button"); x.addEventListener("click", () => { c.btns.splice(j, 1); renderEditor(); refresh(); }); r.append(x); f.append(r); });
        const add = el("button", "btn sm", "+ Button"); add.disabled = c.btns.length >= 5; add.title = add.disabled ? "Action Rows hold at most 5 buttons" : ""; add.addEventListener("click", () => { c.btns.push({ label: "Button", style: 1, url: "" }); renderEditor(); refresh(); }); f.append(add); }
      card.append(f); box.append(card);
    });
  }

  // ---- controls
  const adds = $("#adds");
  [["wrap", "+ Container"], ["text", "+ Text Display"], ["section", "+ Section"], ["sep", "+ Separator"], ["gallery", "+ Media Gallery"], ["thumb", "+ Thumbnail"], ["link", "+ Link Preview"], ["row", "+ Action Row"]].forEach(([k, label]) => {
    const b = el("button", "btn sm", label);
    b.addEventListener("click", () => { if (k === "wrap") { S.wrap = true; $("#wrap").checked = true; } else S.items.push(mk[k]()); renderEditor(); refresh(); });
    adds.append(b); });
  $("#wrap").addEventListener("change", e => { S.wrap = e.target.checked; refresh(); });
  $("#accent").addEventListener("input", e => { S.color = e.target.value; refresh(); });
  const tabs = document.querySelector(".tabs");
  ["JSON", "JavaScript", "Python", "HTML Embed"].forEach(f => { const t = el("button", "tab" + (f === fmt ? " on" : ""), f); t.setAttribute("role", "tab"); t.setAttribute("aria-selected", f === fmt);
    t.addEventListener("click", () => { fmt = f; $("#codeLang").textContent = f; tabs.querySelectorAll(".tab").forEach(x => { x.classList.toggle("on", x === t); x.setAttribute("aria-selected", x === t); }); refresh(); }); tabs.append(t); });
  $("#copyBtn").addEventListener("click", () => { const { msg, errors } = build();
    if (errors.length) return window.setMsg($("#bMsg"), `Fix ${errors.length} issue(s) first. ${errors[0]}`, true);
    window.copyText(gen(msg), $("#bMsg")); });
  $("#resetBtn").addEventListener("click", () => { S = initial(); $("#wrap").checked = true; $("#accent").value = S.color; renderEditor(); refresh(); window.setMsg($("#bMsg"), "Builder reset to the starter message."); });
  $("#clearBtn").addEventListener("click", () => { S.items = []; renderEditor(); refresh(); window.setMsg($("#bMsg"), "Builder cleared."); });
  renderEditor(); refresh();
};
