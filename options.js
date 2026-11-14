(() => {
  "use strict";
  const HAS_EXT = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === "function";
  function showWrongContext() {
    const b = document.getElementById("ctx-warning"), u = document.getElementById("ctx-warning-url");
    if (b) b.style.display = "block"; if (u) u.textContent = "current url: " + location.href;
    document.querySelectorAll("button, input, select, textarea").forEach(el => { el.disabled = true; });
    const l = document.getElementById("live-pill"); if (l) { l.textContent = "offline"; l.classList.remove("live"); }
  }
  if (!HAS_EXT) { showWrongContext(); return; }

  const K_SETTINGS = "tsr_settings_v1", K_PROGRESS = "tsr_progress_v1", K_EMAILS = "tsr_emails_v1", K_TARGET = "tsr_target_channel_v1", K_RATE = "tsr_rate_v2";
  const DEFAULT_SETTINGS = { content: "Chat Messages", reason: "Hateful Conduct", subreason: "Slurs or Symbols", descriptionText: "", delayMin: 800, delayMax: 1800, timeoutMs: 8000, maxRetries: 3, cycleLimit: 10, reloadOnFail: true };
  const CONTENT_TYPES = [
    { label: "Chat Messages", slug: "CHAT_REPORT" }, { label: "Whispers", slug: "WHISPER_REPORT" },
    { label: "Username", slug: "USERNAME_REPORT" }, { label: "User (Avatar, Channel Points, Panels, Tags, etc.)", slug: "USER_REPORT" },
    { label: "Off Twitch Behavior", slug: "OFF_TWITCH_REPORT" }
  ];
  const REASONS = {
    "Ban Evasion": { slug: "ban_evasion", subs: ["Account Ban Evasion", "Aiding Ban Evasion"] },
    "Bullying or Harassment": { slug: "harassment", subs: ["Advocating Harassment","Coordinating Harassment","Malicious Pranks","Revealing Personal Information","Targeted Abuse","Unwanted Sexual Advances"] },
    "Cheating in Game": { slug: "cheating", subs: [] },
    "Explicit Harm": { slug: "explicit_harm", subs: ["Animal Endangerment","Child Endangerment","Swatting"] },
    "Hateful Conduct": { slug: "hateful_conduct", subs: ["Slurs or Symbols","Encouraging Hateful Behavior","Threatening Violence","Mocking Trauma"] },
    "IP Violation": { slug: "ip_violation", subs: [] }, "Impersonation": { slug: "impersonation", subs: [] },
    "Misinformation": { slug: "misinformation", subs: [] },
    "Nudity or Sexually Explicit": { slug: "nudity_sexual", subs: ["Sexually Explicit","Sexual Violence","Full or Partial Nudity","Sexual Conduct Involving Minors","Sharing Private Images"] },
    "Off Twitch Behavior": { slug: "off_twitch_behavior", subs: [] },
    "Self-Harm": { slug: "self_harm", subs: ["Intentional Self-Harm","Threatening Self-Harm","Encouraging Others to Self-Harm"] },
    "Spam, Scams, Bots, or Tampering": { slug: "spam", subs: ["Spam","Scam","Bots","Cyber Attack","Viewership Tampering"] },
    "Terrorism": { slug: "terrorism", subs: [] }, "Underage User": { slug: "underage", subs: [] },
    "Violence or Gore": { slug: "violence_gore", subs: [] }, "Other Illegality": { slug: "other_illegality", subs: [] }
  };
  const $ = id => document.getElementById(id);
  let settings = { ...DEFAULT_SETTINGS }, saveTimer = null;

  function saveSettingsSoon() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { chrome.storage.local.set({ [K_SETTINGS]: settings }); }, 200);
  }

  function populateDropdowns() {
    const cs = $("s-content"), rs = $("s-reason");
    cs.innerHTML = ""; rs.innerHTML = "";
    for (const c of CONTENT_TYPES) { const o = document.createElement("option"); o.value = c.label; o.textContent = c.label; cs.appendChild(o); }
    for (const r of Object.keys(REASONS)) { const o = document.createElement("option"); o.value = r; o.textContent = r; rs.appendChild(o); }
  }

  function updateReasonFieldsVisibility() {
    const hide = $("s-reason").value === "Off Twitch Behavior";
    const rf = $("s-reason-field"), sf = $("s-subreason-field");
    if (rf) rf.style.display = hide ? "none" : ""; if (sf) sf.style.display = hide ? "none" : "";
  }
  function refreshSubs() {
    const ss = $("s-subreason"), p = $("s-reason").value;
    ss.innerHTML = ""; const n = document.createElement("option"); n.value = ""; n.textContent = "— none —"; ss.appendChild(n);
    const r = REASONS[p]; if (!r) { updateReasonFieldsVisibility(); return; }
    for (const s of r.subs) { const o = document.createElement("option"); o.value = s; o.textContent = s; ss.appendChild(o); }
    ss.disabled = p === "Off Twitch Behavior" || r.subs.length === 0; updateReasonFieldsVisibility();
  }

  function applySettingsToForm() {
    $("s-content").value = settings.content; $("s-reason").value = settings.reason; refreshSubs();
    if (settings.subreason) $("s-subreason").value = settings.subreason;
    $("s-delay-min").value = settings.delayMin; $("s-delay-max").value = settings.delayMax;
    $("s-timeout").value = settings.timeoutMs; $("s-retries").value = settings.maxRetries; $("s-cycles").value = settings.cycleLimit;
    refreshFileInfo();
  }
  function refreshFileInfo() {
    const v = parseDescriptionLines(settings.descriptionText || ""), el = $("s-reason-file-info"); if (!el) return;
    el.textContent = settings._reasonFileName ? `${settings._reasonFileName} — ${v.length} variant(s)` : "no .reports file loaded";
  }

  function bindSettings() {
    const bindInt = (el, key, min, max) => {
      const h = () => {
        const n = parseInt(el.value, 10); if (!Number.isFinite(n)) return;
        if (min !== null && n < min) return; if (max !== null && n > max) return;
        settings[key] = n; saveSettingsSoon();
      };
      el.addEventListener("input", h); el.addEventListener("change", h);
    };
    $("s-content").addEventListener("change", () => { settings.content = $("s-content").value; saveSettingsSoon(); });
    $("s-reason").addEventListener("change", () => { settings.reason = $("s-reason").value; refreshSubs(); settings.subreason = $("s-subreason").value || ""; saveSettingsSoon(); });
    $("s-subreason").addEventListener("change", () => { settings.subreason = $("s-subreason").value || ""; saveSettingsSoon(); });
    bindInt($("s-delay-min"), "delayMin", 0, null); bindInt($("s-delay-max"), "delayMax", 0, null);
    bindInt($("s-timeout"), "timeoutMs", 500, null); bindInt($("s-retries"), "maxRetries", 1, 20); bindInt($("s-cycles"), "cycleLimit", 0, 999);
    $("s-reason-file").addEventListener("change", () => {
      const f = $("s-reason-file").files && $("s-reason-file").files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { settings.descriptionText = String(r.result || ""); settings._reasonFileName = f.name; saveSettingsSoon(); refreshFileInfo(); flash(".reports file loaded"); };
      r.onerror = () => flash(".reports file read failed"); r.readAsText(f);
    });
    $("btn-clear-file").addEventListener("click", () => { settings.descriptionText = ""; settings._reasonFileName = null; $("s-reason-file").value = ""; saveSettingsSoon(); refreshFileInfo(); flash(".reports file cleared"); });
  }

  function parseDescriptionLines(raw) {
    if (!raw || typeof raw !== "string") return [];
    const normalized = raw.replace(/\r\n?/g, "\n");
    if (!normalized.includes("$")) { const s = normalized.trim(); return s ? [s] : []; }
    const out = []; let cur = null;
    for (const line of normalized.split("\n")) {
      const lead = line.replace(/^\s+/, "");
      if (lead.startsWith("$")) { if (cur !== null) { const v = cur.trim(); if (v) out.push(v); } cur = lead.slice(1); }
      else if (cur !== null) cur += "\n" + line;
    }
    if (cur !== null) { const v = cur.trim(); if (v) out.push(v); }
    return out;
  }

  function shortUA(ua, browser, major) {
    if (browser && major) return "…" + (browser === "edge" ? "edg" : browser) + "/" + major;
    if (!ua) return "—";
    let m = ua.match(/Edg\/(\d+)/); if (m) return "…edg/" + m[1];
    m = ua.match(/Chrome\/(\d+)/); if (m) return "…chrome/" + m[1];
    m = ua.match(/Firefox\/(\d+)/); if (m) return "…firefox/" + m[1];
    m = ua.match(/Version\/(\d+)/); if (m) return "…safari/" + m[1];
    return "…" + ua.slice(-30);
  }

  function renderProgress(progress, settingsObj, target) {
    const p = progress || {}, s = settingsObj || DEFAULT_SETTINGS;
    const cycle = p.cycleCount || 0, limit = s.cycleLimit === 0 ? "∞" : String(s.cycleLimit ?? "—");
    const used = Array.isArray(p.usedLines) ? p.usedLines.length : 0;
    const total = parseDescriptionLines(s.descriptionText).length;
    $("p-cycle").textContent = String(cycle); $("p-limit").textContent = limit;
    $("p-used").textContent = total > 0 ? `${used} / ${total}` : String(used);
    $("p-target").textContent = target ? "/" + target : "—";
    $("p-ua").textContent = shortUA(p.lastUA, p.lastBrowser, p.lastMajor);
  }

  function renderEmails(rows) {
    const tbody = document.querySelector("#emails-table tbody"), countEl = $("emails-count");
    const arr = Array.isArray(rows) ? rows : []; countEl.textContent = arr.length + " entr" + (arr.length === 1 ? "y" : "ies");
    if (!arr.length) { tbody.innerHTML = `<tr><td colspan="7" class="empty">no emails used yet</td></tr>`; return; }
    const view = arr.slice().reverse();
    tbody.innerHTML = view.map((r, i) => {
      const idx = arr.length - i, ts = r.ts ? new Date(r.ts).toLocaleString() : "";
      return `<tr><td class="idx">${idx}</td><td>${escapeHtml(r.email || "")}</td><td>${escapeHtml(r.channel || "")}</td><td>${escapeHtml(r.reason || "")}</td><td>${escapeHtml(r.subreason || "")}</td><td>${escapeHtml(shortUA(r.ua, r.browser, r.major))}</td><td class="time">${escapeHtml(ts)}</td></tr>`;
    }).join("");
  }
  function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function downloadFile(name, text, type = "text/plain") {
    try {
      const blob = new Blob([text], { type }), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); return true;
    } catch { return false; }
  }

  async function refreshFingerprint() {
    let profile = null, rate = null;
    try { const r = await chrome.runtime.sendMessage({ type: "READ_STATE" }); if (r?.ok && r.data) { profile = r.data.currentProfile || null; rate = r.data.rate || null; } } catch {}
    if (!profile) { try { const s = await chrome.storage.session.get("tsr_profile_v1"); profile = s?.tsr_profile_v1 || null; } catch {} }
    if (!rate) { try { const d = await chrome.storage.local.get(K_RATE); rate = d[K_RATE] || null; } catch {} }
    $("fp-browser").textContent = profile ? profile.browser : "—"; $("fp-platform").textContent = profile ? profile.platform : "—";
    $("fp-version").textContent = profile ? (profile.browser === "edge" ? `Edge ${profile.version}` : profile.browser === "brave" ? `Brave ${profile.version}` : profile.version) : "—";
    $("fp-rate").textContent = rate ? `${rate.tokens}/3` : "3/3"; $("fp-ua-full").textContent = profile ? profile.ua : "";
  }

  function wireButtons() {
    $("btn-refresh").addEventListener("click", reloadAll);
    $("btn-rotate-ua").addEventListener("click", async () => {
      try { const r = await chrome.runtime.sendMessage({ type: "ROTATE_UA" }); flash(r?.ok ? `UA rotated: ${r.browser} ${r.platform}` : "rotate failed: " + (r?.error || "unknown")); refreshFingerprint(); } catch (e) { flash("rotate failed: " + e.message); }
    });
    $("btn-clear-ua").addEventListener("click", async () => {
      try { const r = await chrome.runtime.sendMessage({ type: "CLEAR_UA" }); flash(r?.ok ? "fingerprint rules cleared" : "clear failed: " + (r?.error || "unknown")); refreshFingerprint(); } catch (e) { flash("clear failed: " + e.message); }
    });
    $("btn-reset-progress").addEventListener("click", async () => { await chrome.storage.local.set({ [K_PROGRESS]: { usedLines: [], cycleCount: 0, lastUA: null, lastBrowser: null, lastMajor: null, usedEmails: [] } }); flash("progress reset"); });
    $("btn-reset-all").addEventListener("click", async () => {
      if (!confirm("reset settings + progress + emails?")) return;
      await chrome.storage.local.set({ [K_SETTINGS]: { ...DEFAULT_SETTINGS }, [K_PROGRESS]: { usedLines: [], cycleCount: 0, lastUA: null, lastBrowser: null, lastMajor: null, usedEmails: [] }, [K_EMAILS]: [], [K_TARGET]: null });
      settings = { ...DEFAULT_SETTINGS }; applySettingsToForm(); flash("everything reset");
    });
    $("btn-clear-emails").addEventListener("click", async () => { await chrome.storage.local.set({ [K_EMAILS]: [] }); flash("emails cleared"); });
    $("btn-copy-emails").addEventListener("click", async () => {
      const data = await chrome.storage.local.get(K_EMAILS), rows = data[K_EMAILS] || [];
      const text = rows.map(r => `${new Date(r.ts).toISOString()}\t${r.email}\t${r.channel || ""}\t${r.reason || ""}\t${r.subreason || ""}\t${r.ua || ""}`).join("\n");
      await navigator.clipboard.writeText(text); flash("emails copied");
    });
    $("btn-export-emails").addEventListener("click", async () => {
      const data = await chrome.storage.local.get(K_EMAILS), rows = data[K_EMAILS] || [];
      const header = "ts\temail\tchannel\treason\tsubreason\tuser-agent\n";
      const body = rows.map(r => `${new Date(r.ts).toISOString()}\t${r.email}\t${r.channel || ""}\t${r.reason || ""}\t${r.subreason || ""}\t${r.ua || ""}`).join("\n");
      flash(downloadFile(`tsr-emails-${Date.now()}.tsv`, header + body) ? "emails exported" : "export failed");
    });
  }

  let flashTimer = null;
  function flash(msg) {
    const el = $("settings-note"); if (!el) return;
    const prev = el.textContent; el.textContent = msg;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { el.textContent = prev; }, 1500);
  }

  function subscribeStorage() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes[K_EMAILS]) renderEmails(changes[K_EMAILS].newValue);
      if (changes[K_SETTINGS]) {
        settings = { ...DEFAULT_SETTINGS, ...(changes[K_SETTINGS].newValue || {}) }; delete settings.debug;
        const active = document.activeElement?.id || ""; if (!active.startsWith("s-")) applySettingsToForm();
      }
      if (changes[K_RATE]) refreshFingerprint();
      loadProgressAndTarget();
    });
    try { chrome.storage.session.onChanged.addListener(ch => { if (ch.tsr_profile_v1) refreshFingerprint(); }); } catch {}
  }

  async function loadProgressAndTarget() {
    const data = await chrome.storage.local.get([K_PROGRESS, K_SETTINGS, K_TARGET]);
    renderProgress(data[K_PROGRESS], data[K_SETTINGS] || settings, data[K_TARGET]);
  }

  async function reloadAll() {
    const data = await chrome.storage.local.get([K_SETTINGS, K_PROGRESS, K_EMAILS, K_TARGET]);
    settings = { ...DEFAULT_SETTINGS, ...(data[K_SETTINGS] || {}) }; delete settings.debug;
    applySettingsToForm(); renderProgress(data[K_PROGRESS], settings, data[K_TARGET]);
    renderEmails(data[K_EMAILS] || []); await refreshFingerprint(); flash("refreshed");
  }

  async function init() {
    populateDropdowns(); bindSettings(); wireButtons(); subscribeStorage();
    await reloadAll(); $("live-pill").classList.add("live");
  }

  document.addEventListener("DOMContentLoaded", init, { once: true });
})();