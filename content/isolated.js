(() => {
  "use strict";
  const IS_INCOGNITO = chrome.extension?.inIncognitoContext === true;
  if (!IS_INCOGNITO) return;

  const PROFILE_KEY = "tsr_profile_v1";
  const ANTIFP_KEY = "tsr_antifp_v1";
  const SESSION_SEED_KEY = "tsr_session_seed_v1";
  const TARGET_ORIGIN = location.origin;

  function post(payload) {
    try { window.postMessage({ t: "__tsr_profile", p: payload }, TARGET_ORIGIN); } catch {}
  }

  async function tryFetch() {
    let payload = null;
    try {
      const sess = await chrome.storage.session.get([PROFILE_KEY, SESSION_SEED_KEY]);
      const profile = sess[PROFILE_KEY] || null;
      const sessionSeed = sess[SESSION_SEED_KEY] || null;
      if (profile) {
        const local = await chrome.storage.local.get(ANTIFP_KEY);
        const antifp = local[ANTIFP_KEY] || null;
        payload = { profile, antifp, sessionSeed };
      }
    } catch {
      payload = await new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage({ type: "GET_PROFILE" }, (resp) => {
            if (chrome.runtime.lastError) return resolve(null);
            resolve(resp && resp.profile ? { profile: resp.profile, antifp: resp.antifp, sessionSeed: resp.sessionSeed } : null);
          });
        } catch { resolve(null); }
      });
    }
    if (payload) { post(payload); return; }
    if (++attempts < MAX_ATTEMPTS) setTimeout(tryFetch, RETRY_MS);
  }
  let attempts = 0;
  const MAX_ATTEMPTS = 20;
  const RETRY_MS = 100;
  tryFetch();

  try {
    chrome.storage.session.onChanged.addListener(async (changes) => {
      if (changes[PROFILE_KEY] || changes[SESSION_SEED_KEY]) {
        const sess = await chrome.storage.session.get([PROFILE_KEY, SESSION_SEED_KEY]);
        const local = await chrome.storage.local.get(ANTIFP_KEY);
        if (sess[PROFILE_KEY]) post({ profile: sess[PROFILE_KEY], antifp: local[ANTIFP_KEY] || null, sessionSeed: sess[SESSION_SEED_KEY] || null });
        else post(null);
      }
    });
  } catch {}

  try {
    chrome.runtime.onMessage.addListener((msg) => {
      if (!msg || msg.type !== "PROFILE_UPDATED") return;
      post(msg.profile ? { profile: msg.profile, antifp: msg.antifp, sessionSeed: msg.sessionSeed } : null);
    });
  } catch {}
})();