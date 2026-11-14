const INCOGNITO_ONLY = true;
const RULE_ID_MAIN = 9001;
const RULE_ID_DEFAULT = 9010;
const LEGACY_IDS = [9001, 9002, 9003, 9004, 9005];
const SETTINGS_KEY = "tsr_settings_v1";
const RATE_KEY = "tsr_rate_v2";
const PROGRESS_KEY = "tsr_progress_v1";
const EMAILS_KEY = "tsr_emails_v1";
const RESUME_KEY = "tsr_resume_v1";
const PROFILE_KEY = "tsr_profile_v1";
const ROT_KEY = "tsr_last_rotate_v1";
const ANTIFP_KEY = "tsr_antifp_v1";
const SESSION_SEED_KEY = "tsr_session_seed_v1";
const REAL_BROWSER_KEY = "tsr_real_browser_v1";
const REAL_PLATFORM_KEY = "tsr_real_platform_v1";
const CAPACITY = 3;
const WINDOW_MS = 3600000;
const REFILL_MS = WINDOW_MS / CAPACITY;
const ROT_MIN_MS = 30 * 60 * 1000;
const ROT_PROB = 0.15;

const SPOOF_DOMAINS = [
  "twitch.tv",
  "jtvnw.net",
  "ttvnw.net",
  "twitchcdn.net",
  "live-video.net"
];

const DEFAULT_ANTIFP = {
  timezone: true,
  webrtc: true
};

const REALISTIC_PROFILES = [
  { browser: "chrome", platform: "Windows", version: "131.0.6778.86", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { browser: "chrome", platform: "Windows", version: "131.0.6778.86", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { browser: "chrome", platform: "macOS", version: "131.0.6778.86", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { browser: "chrome", platform: "Linux", version: "131.0.6778.86", ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { browser: "firefox", platform: "Windows", version: "133.0", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0" },
  { browser: "firefox", platform: "macOS", version: "133.0", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 15.8; rv:133.0) Gecko/20100101 Firefox/133.0" },
  { browser: "firefox", platform: "Linux", version: "133.0", ua: "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0" },
  { browser: "safari", platform: "macOS", version: "17.6", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_8_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15" },
  { browser: "edge", platform: "Windows", version: "131.0.2903.86", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.86" },
  { browser: "edge", platform: "macOS", version: "131.0.2903.86", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.86" },
  { browser: "brave", platform: "Windows", version: "131.1.71.118", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" },
  { browser: "brave", platform: "macOS", version: "131.1.71.118", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" }
];

const LANG_POOL = [
  { code: "en-US", tag: "en-US,en;q=0.9", list: ["en-US", "en"], tz: "America/New_York" },
  { code: "en-GB", tag: "en-GB,en;q=0.9", list: ["en-GB", "en"], tz: "Europe/London" },
  { code: "de-DE", tag: "de-DE,de;q=0.9,en;q=0.8", list: ["de-DE", "de", "en"], tz: "Europe/Berlin" },
  { code: "fr-FR", tag: "fr-FR,fr;q=0.9,en;q=0.8", list: ["fr-FR", "fr", "en"], tz: "Europe/Paris" },
  { code: "es-ES", tag: "es-ES,es;q=0.9,en;q=0.8", list: ["es-ES", "es", "en"], tz: "Europe/Madrid" }
];

const DEFAULT_WEBGL_PARAMS = {
  MAX_TEXTURE_SIZE: 16384,
  MAX_RENDERBUFFER_SIZE: 16384,
  MAX_VIEWPORT_DIMS: [16384, 16384],
  MAX_VERTEX_ATTRIBS: 16,
  MAX_VERTEX_UNIFORM_VECTORS: 4096,
  MAX_FRAGMENT_UNIFORM_VECTORS: 1024,
  MAX_VARYING_VECTORS: 31,
  MAX_COMBINED_TEXTURE_IMAGE_UNITS: 32,
  MAX_CUBE_MAP_TEXTURE_SIZE: 16384,
  MAX_TEXTURE_IMAGE_UNITS: 16,
  MAX_VERTEX_TEXTURE_IMAGE_UNITS: 16
};

function isIncognitoContext() {
  try { return chrome.extension.inIncognitoContext === true; } catch { return false; }
}
function isIncognitoSender(sender) {
  return sender?.tab?.incognito === true || isIncognitoContext();
}

function randomSalt() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0];
}

function reduceUA(ua, major) {
  return ua.replace(/Chrome\/[\d.]+/, `Chrome/${major}.0.0.0`).replace(/Edg\/[\d.]+/, `Edg/${major}.0.0.0`);
}

function enrichProfile(p) {
  const major = String(p.version).split(".")[0];
  const platformName = p.platform === "Windows" ? "Win32" : p.platform === "macOS" ? "MacIntel" : "Linux x86_64";
  const vendor = p.browser === "chrome" ? "Google Inc." : p.browser === "edge" ? "Microsoft Corporation" : p.browser === "brave" ? "Google Inc." : p.browser === "safari" ? "Apple Computer, Inc." : "";
  const lang = LANG_POOL[(Math.random() * LANG_POOL.length) | 0];
  const hardwareConcurrency = p.platform === "Windows" ? 8 : p.platform === "macOS" ? 10 : 4;
  const deviceMemory = p.platform === "Windows" ? 8 : p.platform === "macOS" ? 16 : 4;
  const platformVersion = p.platform === "Windows" ? "10.0.0" : p.platform === "macOS" ? "15.8.0" : "6.5.0";
  const screenInfo = p.platform === "Windows"
    ? { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, colorDepth: 24, pixelRatio: 1 }
    : p.platform === "macOS"
    ? { width: 1440, height: 900, availWidth: 1440, availHeight: 875, colorDepth: 30, pixelRatio: 2 }
    : { width: 1920, height: 1080, availWidth: 1920, availHeight: 1055, colorDepth: 24, pixelRatio: 1 };
  const reduced = (p.browser === "chrome" || p.browser === "edge" || p.browser === "brave") ? reduceUA(p.ua, major) : p.ua;
  const out = {
    browser: p.browser, platform: p.platform, mobile: false, version: p.version, major,
    ua: reduced, appVersion: reduced.replace(/^Mozilla\//, ""), platformName, vendor,
    languages: lang.list.slice(), acceptLanguage: lang.tag, timezone: lang.tz,
    hardwareConcurrency, deviceMemory, platformVersion, screen: screenInfo,
    salt: randomSalt(), webglParams: { ...DEFAULT_WEBGL_PARAMS }
  };
  if (p.browser === "chrome" || p.browser === "edge" || p.browser === "brave") {
    const brandName = p.browser === "edge" ? "Microsoft Edge" : p.browser === "brave" ? "Brave" : "Google Chrome";
    out.uaBrands = [
      { brand: "Chromium", version: major },
      { brand: "Not(A:Brand", version: "24" },
      { brand: brandName, version: major }
    ];
    out.fullVersionList = [
      { brand: "Chromium", version: p.version },
      { brand: "Not(A:Brand", version: "24.0.0.0" },
      { brand: brandName, version: p.version }
    ];
  }
  if (p.browser === "firefox") {
    out.oscpu = p.platform === "Windows" ? "Windows NT 10.0; Win64; x64" : p.platform === "macOS" ? "Intel Mac OS X 15.8" : "Linux x86_64";
  }
  return out;
}

let realBrowserCache = null;
let realPlatformCache = null;

async function detectRealBrowser() {
  if (realBrowserCache && realPlatformCache) {
    return { browser: realBrowserCache, platform: realPlatformCache };
  }
  try {
    const stored = await chrome.storage.local.get([REAL_BROWSER_KEY, REAL_PLATFORM_KEY]);
    if (stored[REAL_BROWSER_KEY] && stored[REAL_PLATFORM_KEY]) {
      realBrowserCache = stored[REAL_BROWSER_KEY];
      realPlatformCache = stored[REAL_PLATFORM_KEY];
      return { browser: realBrowserCache, platform: realPlatformCache };
    }
  } catch {}
  let browser = "chrome";
  let platform = "Windows";
  try {
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (nav) {
      if (nav.brave && typeof nav.brave.isBrave === "function") {
        try { await nav.brave.isBrave(); browser = "brave"; } catch {}
      }
      if (browser === "chrome" && nav.userAgentData && Array.isArray(nav.userAgentData.brands)) {
        const brands = nav.userAgentData.brands.map(b => b.brand.toLowerCase());
        if (brands.some(b => b.includes("microsoft edge"))) browser = "edge";
        else if (brands.some(b => b.includes("google chrome"))) browser = "chrome";
      }
      if (browser === "chrome" && nav.userAgent) {
        const ua = nav.userAgent;
        if (/Firefox\//.test(ua)) browser = "firefox";
        else if (/Edg\//.test(ua)) browser = "edge";
        else if (/Chrome\//.test(ua)) browser = "chrome";
        else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "safari";
      }
      const uaPlatform = (nav.userAgentData && nav.userAgentData.platform) || nav.platform || "";
      if (/Win/i.test(uaPlatform)) platform = "Windows";
      else if (/Mac/i.test(uaPlatform)) platform = "macOS";
      else if (/Linux/i.test(uaPlatform)) platform = "Linux";
      else if (/Mac/i.test(nav.userAgent || "")) platform = "macOS";
      else if (/Linux/i.test(nav.userAgent || "")) platform = "Linux";
    }
  } catch {}
  realBrowserCache = browser;
  realPlatformCache = platform;
  try {
    await chrome.storage.local.set({ [REAL_BROWSER_KEY]: browser, [REAL_PLATFORM_KEY]: platform });
  } catch {}
  return { browser, platform };
}

function getAllowedBrowserFamily(realBrowser) {
  if (realBrowser === "brave" || realBrowser === "chrome" || realBrowser === "edge") return "chromium";
  if (realBrowser === "firefox") return "firefox";
  if (realBrowser === "safari") return "safari";
  return "chromium";
}

function getBrowserWeights(realBrowser) {
  if (realBrowser === "brave") return { brave: 60, chrome: 30, edge: 10 };
  if (realBrowser === "chrome") return { chrome: 60, brave: 20, edge: 20 };
  if (realBrowser === "edge") return { edge: 60, chrome: 30, brave: 10 };
  if (realBrowser === "firefox") return { firefox: 100 };
  if (realBrowser === "safari") return { safari: 100 };
  return { chrome: 60, brave: 20, edge: 20 };
}

let lastUa = null;

function pickWeightedBrowser(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [browser, weight] of entries) { if (r < weight) return browser; r -= weight; }
  return entries[0][0];
}

async function pickProfile() {
  const real = await detectRealBrowser();
  const family = getAllowedBrowserFamily(real.browser);
  const weights = getBrowserWeights(real.browser);
  const allowedBrowsers = Object.keys(weights);
  let pool = REALISTIC_PROFILES.filter(p => {
    const pf = p.browser === "brave" || p.browser === "chrome" || p.browser === "edge" ? "chromium" : p.browser;
    return pf === family && allowedBrowsers.includes(p.browser) && p.platform === real.platform;
  });
  if (!pool.length) {
    pool = REALISTIC_PROFILES.filter(p => {
      const pf = p.browser === "brave" || p.browser === "chrome" || p.browser === "edge" ? "chromium" : p.browser;
      return pf === family && allowedBrowsers.includes(p.browser);
    });
  }
  if (!pool.length) {
    notify("TS-Reporter", "No suitable profile for " + real.browser + "/" + real.platform);
    return null;
  }
  if (!lastUa) {
    try { const d = await chrome.storage.session.get(PROFILE_KEY); lastUa = d[PROFILE_KEY]?.ua || null; } catch {}
  }
  const fresh = pool.filter(p => p.ua !== lastUa);
  const finalPool = fresh.length ? fresh : pool;
  const browser = pickWeightedBrowser(weights);
  let candidates = finalPool.filter(p => p.browser === browser);
  if (!candidates.length) candidates = finalPool;
  const raw = candidates[(Math.random() * candidates.length) | 0];
  lastUa = raw.ua;
  return enrichProfile(raw);
}

function buildSecChUa(browser, major, grease) {
  if (browser === "edge") return `"Microsoft Edge";v="${major}", "Chromium";v="${major}", "Not(A:Brand";v="${grease}"`;
  if (browser === "brave") return `"Chromium";v="${major}", "Brave";v="${major}", "Not(A:Brand";v="${grease}"`;
  return `"Chromium";v="${major}", "Not(A:Brand";v="${grease}", "Google Chrome";v="${major}"`;
}
function buildFullVersionList(browser, fullVersion, grease) {
  if (browser === "edge") return `"Microsoft Edge";v="${fullVersion}", "Chromium";v="${fullVersion}", "Not(A:Brand";v="${grease}.0.0.0"`;
  if (browser === "brave") return `"Chromium";v="${fullVersion}", "Brave";v="${fullVersion}", "Not(A:Brand";v="${grease}.0.0.0"`;
  return `"Chromium";v="${fullVersion}", "Not(A:Brand";v="${grease}.0.0.0", "Google Chrome";v="${fullVersion}"`;
}

function buildRequestHeaders(profile) {
  const headers = [
    { header: "user-agent", operation: "set", value: profile.ua },
    { header: "accept-language", operation: "set", value: profile.acceptLanguage }
  ];
  if (profile.browser === "chrome" || profile.browser === "edge" || profile.browser === "brave") {
    const v = profile.version, m = profile.major, g = 24;
    headers.push(
      { header: "sec-ch-ua", operation: "set", value: buildSecChUa(profile.browser, m, g) },
      { header: "sec-ch-ua-mobile", operation: "set", value: "?0" },
      { header: "sec-ch-ua-platform", operation: "set", value: `"${profile.platform}"` },
      { header: "sec-ch-ua-full-version-list", operation: "set", value: buildFullVersionList(profile.browser, v, g) }
    );
  } else {
    headers.push(
      { header: "sec-ch-ua", operation: "remove" },
      { header: "sec-ch-ua-mobile", operation: "remove" },
      { header: "sec-ch-ua-platform", operation: "remove" },
      { header: "sec-ch-ua-full-version-list", operation: "remove" }
    );
  }
  if (profile.browser === "safari") {
    headers.push(
      { header: "sec-fetch-site", operation: "remove" },
      { header: "sec-fetch-mode", operation: "remove" },
      { header: "sec-fetch-user", operation: "remove" },
      { header: "sec-fetch-dest", operation: "remove" }
    );
  }
  return headers;
}

async function getAntifpSettings() {
  try {
    const d = await chrome.storage.local.get(ANTIFP_KEY);
    return { ...DEFAULT_ANTIFP, ...(d[ANTIFP_KEY] || {}) };
  } catch { return { ...DEFAULT_ANTIFP }; }
}

async function getOrCreateSessionSeed() {
  try {
    const s = await chrome.storage.session.get(SESSION_SEED_KEY);
    if (typeof s[SESSION_SEED_KEY] === "number") return s[SESSION_SEED_KEY];
    const seed = randomSalt();
    await chrome.storage.session.set({ [SESSION_SEED_KEY]: seed });
    return seed;
  } catch { return randomSalt(); }
}

async function syncProfileToTab(tabId, profile, antifp, sessionSeed) {
  if (typeof tabId !== "number") return;
  const payload = { profile, antifp, sessionSeed };
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: "MAIN",
      args: [payload],
      func: (p) => { try { window.postMessage({ t: "__tsr_profile", p }, location.origin); } catch {} }
    });
  } catch {}
  try { chrome.tabs.sendMessage(tabId, { type: "PROFILE_UPDATED", profile, antifp, sessionSeed }).catch(() => {}); } catch {}
}

async function applyProfile(profile) {
  if (!profile) return;
  const antifp = await getAntifpSettings();
  const sessionSeed = await getOrCreateSessionSeed();
  const headers = buildRequestHeaders(profile);
  const rules = [{
    id: RULE_ID_MAIN,
    priority: 1,
    action: { type: "modifyHeaders", requestHeaders: headers },
    condition: { requestDomains: SPOOF_DOMAINS.slice() }
  }];
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [RULE_ID_MAIN, RULE_ID_DEFAULT].concat(LEGACY_IDS),
    addRules: rules
  });
  try { await chrome.storage.session.set({ [PROFILE_KEY]: profile }); } catch {}
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.filter(t => t.incognito && typeof t.id === "number" && /^https?:\/\/([^/]+\.)?twitch\.tv\//.test(t.url || ""))
        .map(t => syncProfileToTab(t.id, profile, antifp, sessionSeed))
    );
  } catch {}
}

async function clearRules() {
  try {
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [RULE_ID_MAIN, RULE_ID_DEFAULT].concat(LEGACY_IDS)
    });
  } catch {}
  try { await chrome.storage.session.remove(PROFILE_KEY); } catch {}
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.filter(t => t.incognito && typeof t.id === "number" && /^https?:\/\/([^/]+\.)?twitch\.tv\//.test(t.url || ""))
        .map(t => syncProfileToTab(t.id, null, null, null))
    );
  } catch {}
}

async function resetLanguageToEnglish() {
  try {
    const rule = {
      id: RULE_ID_DEFAULT,
      priority: 1,
      action: { type: "modifyHeaders", requestHeaders: [{ header: "accept-language", operation: "set", value: "en-US,en;q=0.9" }] },
      condition: { requestDomains: SPOOF_DOMAINS.slice() }
    };
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [RULE_ID_MAIN].concat(LEGACY_IDS),
      addRules: [rule]
    });
  } catch { return; }
  try { await chrome.storage.session.remove(PROFILE_KEY); } catch {}
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(
      tabs.filter(t => t.incognito && typeof t.id === "number" && /^https?:\/\/([^/]+\.)?twitch\.tv\//.test(t.url || ""))
        .map(t => syncProfileToTab(t.id, null, null, null))
    );
  } catch {}
}

async function migrateLegacyDynamicRules() {
  try { await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: LEGACY_IDS }); } catch {}
}

async function acquireReportToken() {
  const now = Date.now();
  const stored = await chrome.storage.local.get(RATE_KEY);
  const bucket = stored[RATE_KEY] || { tokens: CAPACITY, last: now };
  const elapsed = now - bucket.last;
  const intervals = Math.floor(elapsed / REFILL_MS);
  if (intervals > 0) {
    bucket.tokens = Math.min(CAPACITY, bucket.tokens + intervals);
    bucket.last += intervals * REFILL_MS;
  }
  if (bucket.tokens < 1) {
    const waitMs = REFILL_MS - (now - bucket.last);
    return { ok: false, waitMs: Math.max(0, Math.ceil(waitMs)) };
  }
  bucket.tokens -= 1;
  await chrome.storage.local.set({ [RATE_KEY]: bucket });
  return { ok: true, remaining: bucket.tokens };
}

async function writeProgress(payload) {
  await chrome.storage.local.set({ [PROGRESS_KEY]: payload });
}

async function appendEmail(record) {
  const s = await chrome.storage.local.get(EMAILS_KEY);
  const prev = s[EMAILS_KEY] || [];
  await chrome.storage.local.set({ [EMAILS_KEY]: prev.concat(record).slice(-1000) });
}

async function readState() {
  const data = await chrome.storage.local.get([PROGRESS_KEY, EMAILS_KEY, RESUME_KEY, SETTINGS_KEY, RATE_KEY, ANTIFP_KEY, REAL_BROWSER_KEY, REAL_PLATFORM_KEY]);
  let profile = null;
  try { const sess = await chrome.storage.session.get(PROFILE_KEY); profile = sess[PROFILE_KEY] || null; } catch {}
  let sessionSeed = null;
  try { const sess = await chrome.storage.session.get(SESSION_SEED_KEY); sessionSeed = sess[SESSION_SEED_KEY] || null; } catch {}
  return {
    ...data,
    currentProfile: profile,
    rate: data[RATE_KEY] || null,
    antifp: { ...DEFAULT_ANTIFP, ...(data[ANTIFP_KEY] || {}) },
    sessionSeed,
    realBrowser: data[REAL_BROWSER_KEY] || null,
    realPlatform: data[REAL_PLATFORM_KEY] || null
  };
}

const FALLBACK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
function notify(title, message) {
  try {
    chrome.notifications.create({ type: "basic", iconUrl: FALLBACK_ICON, title: title || "TS-Reporter", message: message || "" });
  } catch {}
}

async function ensureSessionStorageAccess() {
  try { await chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" }); } catch {}
}

async function bootstrap() {
  await migrateLegacyDynamicRules();
  await detectRealBrowser();
  if (!isIncognitoContext()) {
    try { await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [RULE_ID_MAIN].concat(LEGACY_IDS) }); } catch {}
    return;
  }
  await ensureSessionStorageAccess();
  try {
    const existing = await chrome.declarativeNetRequest.getSessionRules();
    if (existing.some(r => r.id === RULE_ID_MAIN)) return;
    const profile = await pickProfile();
    if (profile) await applyProfile(profile);
  } catch {}
}

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab?.incognito || info.status !== "complete") return;
  const url = tab.url || "";
  if (!/^https?:\/\/([^/]+\.)?twitch\.tv\//.test(url)) return;
  try {
    const sess = await chrome.storage.session.get(PROFILE_KEY);
    if (sess[PROFILE_KEY]) {
      const antifp = await getAntifpSettings();
      const seed = await getOrCreateSessionSeed();
      await syncProfileToTab(tabId, sess[PROFILE_KEY], antifp, seed);
    }
  } catch {}
  try {
    const s = await chrome.storage.local.get(ROT_KEY);
    const last = s[ROT_KEY] || 0;
    if (Date.now() - last < ROT_MIN_MS || Math.random() > ROT_PROB) return;
    const profile = await pickProfile();
    if (profile) {
      await applyProfile(profile);
      await chrome.storage.local.set({ [ROT_KEY]: Date.now() });
    }
  } catch {}
});

chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId === 0 || !isIncognitoContext()) return;
  const isTwitch = /^https?:\/\/([^/]+\.)?twitch\.tv\//.test(details.url);
  const isBlank = details.url.startsWith("about:blank") || details.url.startsWith("about:srcdoc");
  if (!isTwitch && !isBlank) return;
  try {
    const sess = await chrome.storage.session.get(PROFILE_KEY);
    const profile = sess[PROFILE_KEY];
    if (!profile) return;
    const antifp = await getAntifpSettings();
    const seed = await getOrCreateSessionSeed();
    await chrome.scripting.executeScript({
      target: { tabId: details.tabId, frameIds: [details.frameId] },
      world: "MAIN",
      args: [{ profile, antifp, sessionSeed: seed }],
      func: (p) => { try { window.postMessage({ t: "__tsr_profile", p }, location.origin); } catch {} }
    });
  } catch {}
}, { url: [{ hostSuffix: "twitch.tv" }, { urlPrefix: "about:blank" }, { urlPrefix: "about:srcdoc" }] });

async function openDashboard(sender) {
  let url;
  try { url = chrome.runtime.getURL("options.html"); } catch (e) { return { ok: false, error: "getURL failed: " + (e?.message || String(e)) }; }
  const attempts = [];
  if (typeof sender?.tab?.windowId === "number") attempts.push({ url, active: true, windowId: sender.tab.windowId });
  attempts.push({ url, active: true });
  let lastErr = null;
  for (const a of attempts) {
    try { const t = await chrome.tabs.create(a); return { ok: true, tabId: t?.id, url }; } catch (e) { lastErr = e; }
  }
  try {
    const winOpts = { url, focused: true };
    if (isIncognitoContext()) winOpts.incognito = true;
    const w = await chrome.windows.create(winOpts);
    return { ok: true, windowId: w?.id, url };
  } catch (e) { if (!lastErr) lastErr = e; }
  return { ok: false, error: lastErr ? (lastErr.message || String(lastErr)) : "unknown", url };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return false;
  if (msg.type === "GET_INCOGNITO") { sendResponse({ incognito: isIncognitoSender(sender) }); return false; }
  if (msg.type === "GET_PROFILE") {
    chrome.storage.session.get(PROFILE_KEY).then(async d => {
      const antifp = await getAntifpSettings();
      let seed = null;
      try { const s = await chrome.storage.session.get(SESSION_SEED_KEY); seed = s[SESSION_SEED_KEY] || null; } catch {}
      sendResponse({ ok: true, profile: d[PROFILE_KEY] || null, antifp, sessionSeed: seed });
    }).catch(e => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg.type === "BG_LOG") { sendResponse({ ok: true }); return false; }
  if (INCOGNITO_ONLY && !isIncognitoSender(sender)) { sendResponse({ ok: false, error: "incognito_required" }); return false; }
  switch (msg.type) {
    case "NOTIFY": notify(msg.title, msg.message); sendResponse({ ok: true }); return false;
    case "ROTATE_UA": {
      (async () => {
        try {
          const profile = await pickProfile();
          if (!profile) return sendResponse({ ok: false, error: "no_matching_profile" });
          await applyProfile(profile);
          sendResponse({ ok: true, ua: profile.ua, browser: profile.browser, platform: profile.platform, version: profile.version, major: profile.major });
        } catch (e) { sendResponse({ ok: false, error: String(e) }); }
      })();
      return true;
    }
    case "CLEAR_UA": clearRules().then(() => sendResponse({ ok: true }), e => sendResponse({ ok: false, error: String(e) })); return true;
    case "RESET_LANGUAGE_EN": resetLanguageToEnglish().then(() => sendResponse({ ok: true }), e => sendResponse({ ok: false, error: String(e) })); return true;
    case "OPEN_DASHBOARD": (async () => { try { sendResponse(await openDashboard(sender)); } catch (e) { sendResponse({ ok: false, error: String(e?.message || e) }); } })(); return true;
    case "ACQUIRE_TOKEN": acquireReportToken().then(sendResponse, e => sendResponse({ ok: false, error: String(e) })); return true;
    case "WRITE_PROGRESS": writeProgress(msg.payload).then(() => sendResponse({ ok: true }), e => sendResponse({ ok: false, error: String(e) })); return true;
    case "APPEND_EMAIL": appendEmail(msg.record).then(() => sendResponse({ ok: true }), e => sendResponse({ ok: false, error: String(e) })); return true;
    case "READ_STATE": readState().then(data => sendResponse({ ok: true, data }), e => sendResponse({ ok: false, error: String(e) })); return true;
    default: return false;
  }
});

chrome.runtime.onInstalled.addListener(() => { bootstrap(); });
chrome.runtime.onStartup.addListener(() => { bootstrap(); });