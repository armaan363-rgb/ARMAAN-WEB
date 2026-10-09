/* Tool registry. available:true only for tools that genuinely work. */
const b64e = s => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s.trim()), c => c.charCodeAt(0)));
const tools = [
  { id: "json", name: "JSON Formatter", desc: "Format, validate and minify JSON.", tags: "json format validate minify", available: true, hint: "Paste JSON",
    actions: [["Format", s => JSON.stringify(JSON.parse(s), null, 2)], ["Minify", s => JSON.stringify(JSON.parse(s))]] },
  { id: "uuid", name: "UUID Generator", desc: "Generate v4 UUIDs (type a count, max 100).", tags: "uuid guid id generator", available: true, hint: "How many? (default 1)",
    actions: [["Generate", s => { const n = Math.min(100, Math.max(1, parseInt(s) || 1)); return Array.from({ length: n }, () => crypto.randomUUID()).join("\n"); }]] },
  { id: "b64", name: "Base64 Encoder / Decoder", desc: "UTF-8 safe Base64 conversion.", tags: "base64 encoding decode encode", available: true, hint: "Text or Base64",
    actions: [["Encode", b64e], ["Decode", b64d]] },
  { id: "regex", name: "Regex Tester", desc: "Test patterns against text.", tags: "regex regexp pattern", available: true, hint: "Line 1: /pattern/flags — remaining lines: test text",
    actions: [["Test", s => {
      const [first, ...rest] = s.split("\n"); const m = first.match(/^\/(.+)\/([a-z]*)$/s);
      if (!m) throw new Error("First line must look like /pattern/flags, e.g. /\\d+/g");
      const flags = m[2].includes("g") ? m[2] : m[2] + "g";
      const found = [...rest.join("\n").matchAll(new RegExp(m[1], flags))];
      return found.length ? found.map((x, i) => `#${i + 1} @${x.index}: ${JSON.stringify(x[0])}` + (x.length > 1 ? " groups=" + JSON.stringify(x.slice(1)) : "")).join("\n") : "No matches.";
    }]] },
  { id: "ogmeta", name: "Discord Link Preview Meta", desc: "Generate Open Graph tags so Discord shows a rich embed for your link.", tags: "discord link preview embed opengraph og meta seo", available: true,
    hint: "One field per line: title, description, url, image, color (optional), site (optional)",
    sample: "title: ARMAAN.BOND\ndescription: Projects, tools, APIs and experiments in one developer ecosystem.\nurl: https://armaan.bond/\nimage: https://armaan.bond/assets/images/og-image.png\ncolor: #22D3EE\nsite: ARMAAN.BOND",
    actions: [["Generate", s => {
      const f = {}; s.split("\n").forEach(l => { const i = l.indexOf(":"); if (i > 0) f[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); });
      for (const k of ["title", "description", "url", "image"]) if (!f[k]) throw new Error(`Missing a "${k}:" line.`);
      for (const k of ["url", "image"]) { let ok = false; try { ok = /^https?:$/.test(new URL(f[k]).protocol); } catch {} if (!ok) throw new Error(`"${k}" must be a full http(s) URL, got "${f[k]}".`); }
      if (f.color && !/^#[0-9a-f]{6}$/i.test(f.color)) throw new Error(`"color" must be a 6-digit hex like #22D3EE, got "${f.color}".`);
      const e = v => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      return ["<!-- Put these in <head>, in the raw HTML (not injected by JavaScript). Use an absolute image URL, ideally 1200x630. -->",
        `<meta property="og:title" content="${e(f.title)}">`, `<meta property="og:description" content="${e(f.description)}">`, `<meta property="og:url" content="${e(f.url)}">`,
        `<meta property="og:type" content="website">`, f.site ? `<meta property="og:site_name" content="${e(f.site)}">` : "", `<meta property="og:image" content="${e(f.image)}">`,
        `<meta name="twitter:card" content="summary_large_image">`, f.color ? `<meta name="theme-color" content="${e(f.color)}">  <!-- Discord uses this as the embed stripe colour -->` : ""].filter(Boolean).join("\n");
    }]] },
  { id: "builder", name: "Discord Components V2 Builder", desc: "Visual builder with live preview and code export.", tags: "discord embed components builder", available: true, link: "#builder" },
  { id: "api", name: "API Tester", desc: "Send HTTP requests from the browser.", tags: "api http request", available: false },
  { id: "http", name: "HTTP Inspector", desc: "Inspect headers and responses.", tags: "http headers inspector api", available: false },
  { id: "motd", name: "Minecraft MOTD Generator", desc: "Colour-coded server MOTDs.", tags: "minecraft motd server", available: false }
];
