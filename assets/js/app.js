(() => {
  const $ = s => document.querySelector(s);
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const safeUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };

  // Navbar
  const nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
  const onScroll = () => nav.classList.toggle("solid", scrollY > 24);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const setMenu = o => { menu.classList.toggle("open", o); burger.setAttribute("aria-expanded", o); };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.addEventListener("click", e => e.target.tagName === "A" && setMenu(false));
  addEventListener("keydown", e => { if (e.key === "Escape") { setMenu(false); burger.focus(); } });

  // Socials
  // Discord profile via Lanyard (free public API, no key)
  const dcId = String(discordProfile.userId || "").trim(), dcOk = /^\d{17,20}$/.test(dcId);
  if (dcOk && !socials.discord) socials.discord = "https://discord.com/users/" + dcId;
  const ST = { online: ["Online", "#23a55a"], idle: ["Idle", "#f0b232"], dnd: ["Do Not Disturb", "#f23f43"], offline: ["Offline", "#80848e"] };
  async function loadDiscord() {
    const card = $("#dcCard"); if (!dcId) return;
    if (!dcOk) { card.hidden = false; card.replaceChildren(el("p", "muted", "Discord profile: userId in projects.js must be a numeric ID (17–20 digits).")); return; }
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch("https://api.lanyard.rest/v1/users/" + dcId, { signal: ctl.signal });
      const j = await r.json();
      if (!j.success) throw new Error(j.error && j.error.code === "user_not_monitored" ? "Lanyard isn't monitoring this account yet. Join discord.gg/lanyard once, then refresh." : "Lanyard error: " + ((j.error && j.error.message) || r.status));
      const d = j.data, u = d.discord_user, st = ST[d.discord_status] || ST.offline;
      const img = el("img", "dav"); img.alt = ""; img.width = img.height = 56; img.referrerPolicy = "no-referrer";
      img.src = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128` : "https://cdn.discordapp.com/embed/avatars/0.png";
      const dot = el("i", "sdot"); dot.style.background = st[1];
      const box = el("div", "dinfo"); const name = el("b", "", u.global_name || u.username); const sub = el("span", "muted mono", "@" + u.username + " · " + st[0]);
      box.append(name, sub);
      const act = (d.activities || []).find(a => a.type !== 4), cs = (d.activities || []).find(a => a.type === 4);
      const line = d.listening_to_spotify && d.spotify ? "♫ " + d.spotify.song + " — " + d.spotify.artist : act ? act.name + (act.details ? " · " + act.details : "") : cs && cs.state ? cs.state : "";
      if (line) box.append(el("span", "dact", line));
      const wrap = el("div", "dpic"); wrap.append(img, dot);
      card.replaceChildren(wrap, box); card.hidden = false;
    } catch (e) {
      card.hidden = false; card.replaceChildren(el("p", "muted", e.name === "AbortError" ? "Discord profile timed out. Lanyard did not respond in 8 seconds." : e.message.startsWith("Lanyard") ? e.message : "Could not load Discord profile (network error or blocked request)."));
    } finally { clearTimeout(to); }
  }
  loadDiscord(); if (dcOk) setInterval(() => !document.hidden && loadDiscord(), 60000);

  const gh = safeUrl(socials.github);
  if (gh) for (const id of ["#gh", "#ghF"]) { const a = $(id); a.href = gh; a.hidden = false; }
  const sl = $("#socialLinks");
  for (const [k, v] of Object.entries(socials)) { const u = safeUrl(v); if (u) { const a = el("a", "btn", k.toUpperCase() + " ↗"); a.href = u; a.target = "_blank"; a.rel = "noopener"; sl.append(a); } }

  const badge = s => el("span", "st " + s.toLowerCase(), "● " + s);
  // Projects
  const pg = $("#projectGrid");
  for (const p of projects) {
    const c = el("article", "card rv" + (p.theme ? " " + p.theme : "")); const u = safeUrl(p.url);
    if (p.theme === "gold") for (let i = 0; i < 5; i++) { const sp = el("i", "spark"); sp.style.cssText = `left:${10 + i * 19}%;--d:${i * -1.1}s`; c.append(sp); }
    c.append(el("h3", "", p.name.toUpperCase()), el("p", "", p.description), el("p", "muted mono", p.category), badge(p.status));
    if (u) { const a = el("a", "btn pri", (p.cta || "OPEN") + " ↗"); a.href = u; a.target = "_blank"; a.rel = "noopener"; c.append(a); }
    pg.append(c);
  }
  // Services
  const sg = $("#svcGrid");
  for (const s of services) {
    const c = el("article", "card rv" + (s.theme ? " " + s.theme : "")); c.append(el("h3", "mono", s.host), el("p", "", s.desc), badge(s.status));
    if (s.status === "ACTIVE") { const a = el("a", "lnk", "Visit ↗"); a.href = "https://" + s.host; a.target = "_blank"; a.rel = "noopener"; c.append(a); }
    sg.append(c);
  }

  // Terminal
  const lines = ["> initializing ecosystem...", "> loading projects...", "> checking services...", "> systems ready"], term = $("#term");
  if (reduce) term.textContent = lines.join("\n");
  else { let l = 0, c = 0; const tick = () => { term.textContent = lines.slice(0, l).join("\n") + (l ? "\n" : "") + lines[l].slice(0, c) + "▌"; if (++c > lines[l].length) { l++; c = 0; if (l >= lines.length) { term.textContent = lines.join("\n"); return; } setTimeout(tick, 350); } else setTimeout(tick, 28); }; tick(); }

  // Tools grid + search
  const tg = $("#toolGrid"), panel = $("#toolPanel"), cards = [];
  for (const t of tools) {
    const c = el("article", "card rv"); c.dataset.s = (t.name + " " + t.desc + " " + t.tags).toLowerCase();
    c.append(el("h3", "", t.name), el("p", "", t.desc), badge(t.available ? "ACTIVE" : "PLANNED"));
    if (t.available) { const b = el("button", "btn sm", t.link ? "OPEN BUILDER" : "OPEN"); b.addEventListener("click", () => t.link ? $(t.link).scrollIntoView({ behavior: reduce ? "auto" : "smooth" }) : openTool(t)); c.append(b); }
    tg.append(c); cards.push(c);
  }
  $("#toolSearch").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase(); let n = 0;
    for (const c of cards) { const m = !q || c.dataset.s.includes(q); c.hidden = !m; n += m; }
    $("#noTools").hidden = n > 0;
  });
  const msg = (e, t, bad) => { e.textContent = t; e.className = "msg" + (bad ? " bad" : ""); };
  function openTool(t) {
    $("#tpTitle").textContent = t.name; $("#tpHint").textContent = t.hint; $("#tpIn").value = t.sample || ""; $("#tpOut").value = ""; msg($("#tpMsg"), "");
    const box = $("#tpActions"); box.replaceChildren();
    for (const [label, fn] of t.actions) {
      const b = el("button", "btn pri sm", label);
      b.addEventListener("click", () => { try { $("#tpOut").value = fn($("#tpIn").value); msg($("#tpMsg"), "Done."); } catch (e) { $("#tpOut").value = ""; msg($("#tpMsg"), `${t.name}: ${e.message}`, true); } });
      box.append(b);
    }
    const cp = el("button", "btn sm", "Copy output");
    cp.addEventListener("click", () => window.copyText($("#tpOut").value, $("#tpMsg")));
    box.append(cp); panel.hidden = false; $("#tpIn").focus();
  }
  $("#tpClose").addEventListener("click", () => panel.hidden = true);

  window.copyText = async (text, out) => {
    if (!text) return msg(out, "Nothing to copy yet.", true);
    try { await navigator.clipboard.writeText(text); msg(out, "Copied to clipboard."); }
    catch {
      try { const t = el("textarea"); t.value = text; t.style.cssText = "position:fixed;opacity:0"; document.body.append(t); t.select(); const ok = document.execCommand("copy"); t.remove(); msg(out, ok ? "Copied to clipboard." : "Copy was blocked by the browser. Select the text and copy manually.", !ok); }
      catch { msg(out, "Copy failed: clipboard access is unavailable. Select the text and copy manually.", true); }
    }
  };
  window.safeUrl = safeUrl; window.el = el; window.setMsg = msg;

  // Role rotator, scroll progress, card spotlight
  const roles = ["Discord bots", "Web applications", "APIs", "Automation systems", "Experimental tools"], roleEl = $("#role");
  if (reduce) roleEl.textContent = roles.join(" · ");
  else { let ri = 0, ci = 0, del = false; const step = () => { const w = roles[ri]; ci += del ? -1 : 1; roleEl.textContent = w.slice(0, ci);
    let t = del ? 35 : 70; if (!del && ci === w.length) { del = true; t = 1500; } else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; t = 300; } setTimeout(step, t); }; step(); }
  const prog = $("#prog"); let tk = false;
  addEventListener("scroll", () => { if (!tk) { tk = true; requestAnimationFrame(() => { const h = document.documentElement.scrollHeight - innerHeight; prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; tk = false; }); } }, { passive: true });
  document.addEventListener("pointermove", e => { const c = e.target.closest && e.target.closest(".card"); if (c) { const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px"); } }, { passive: true });

  // Ticker of real subdomains
  const tkEl = $("#tk"); if (tkEl) for (let i = 0; i < 4; i++) services.forEach(s => tkEl.append(el("span", s.status === "ACTIVE" ? "on" : "", s.host)));
  // Tilt on hover-capable devices, ripple on buttons, parallax shapes
  if (!reduce && matchMedia("(hover:hover)").matches) document.addEventListener("pointermove", e => { const c = e.target.closest && e.target.closest(".card"); if (!c) return; c.classList.add("tilt"); const r = c.getBoundingClientRect(); c.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 6 + "deg"); c.style.setProperty("--rx", (.5 - (e.clientY - r.top) / r.height) * 6 + "deg"); }, { passive: true });
  document.addEventListener("pointerdown", e => { const b = e.target.closest && e.target.closest(".btn"); if (!b || reduce) return; const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), sp = el("span", "rip"); sp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`; b.append(sp); setTimeout(() => sp.remove(), 650); });
  if (!reduce) { let py = false; addEventListener("scroll", () => { if (!py) { py = true; requestAnimationFrame(() => { document.documentElement.style.setProperty("--sy", scrollY); py = false; }); } }, { passive: true }); }

  // Reveal on scroll
  const rvs = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)) rvs.forEach(e => e.classList.add("in"));
  else { const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .12 });
    rvs.forEach((e, i) => { e.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(e); }); }
  window.initBuilder && window.initBuilder();
})();
