(() => {
  "use strict";

  const CFG = { profile: null, antifp: null, sessionSeed: 0 };

  window.addEventListener("message", (ev) => {
    if (ev.source !== window) return;
    const d = ev.data;
    if (!d || d.t !== "__tsr_profile") return;
    CFG.profile = d.p?.profile || null;
    CFG.antifp = d.p?.antifp || null;
    CFG.sessionSeed = d.p?.sessionSeed || 0;
  }, true);

  const _toString = Function.prototype.toString;
  const nativeLike = new WeakMap();
  function markNative(fn, original) { nativeLike.set(fn, original); return fn; }
  function mimic(patched, nativeFn, name, length) {
    try {
      Object.defineProperty(patched, "name", { value: name, configurable: true });
      Object.defineProperty(patched, "length", { value: length, configurable: true });
    } catch {}
    const realNative = nativeLike.get(nativeFn) || nativeFn;
    return markNative(patched, realNative);
  }

  {
    const patchedToString = function () {
      const orig = nativeLike.get(this);
      return orig ? _toString.call(orig) : _toString.call(this);
    };
    try {
      Object.defineProperty(patchedToString, "name", { value: "toString", configurable: true });
      Object.defineProperty(patchedToString, "length", { value: 0, configurable: true });
    } catch {}
    markNative(patchedToString, _toString);
    Function.prototype.toString = patchedToString;
  }

  function safeDefine(obj, prop, descriptor) { try { Reflect.defineProperty(obj, prop, descriptor); } catch {} }
  function enabled(feature) { return CFG.antifp ? CFG.antifp[feature] !== false : true; }

  (function patchTimezone() {
    if (!enabled("timezone") || typeof Intl === "undefined" || !Intl.DateTimeFormat) return;
    const DTF = Intl.DateTimeFormat;
    const origRO = DTF.prototype.resolvedOptions;
    if (typeof origRO === "function") {
      DTF.prototype.resolvedOptions = mimic(function () {
        const o = origRO.call(this);
        if (CFG.profile?.timezone) { try { o.timeZone = CFG.profile.timezone; } catch {} }
        return o;
      }, origRO, "resolvedOptions", 0);
    }
    const origOff = Date.prototype.getTimezoneOffset;
    if (typeof origOff === "function") {
      Date.prototype.getTimezoneOffset = mimic(function () {
        if (!CFG.profile?.timezone) return origOff.call(this);
        try {
          const dtf = new DTF("en-US", { timeZone: CFG.profile.timezone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
          const parts = dtf.formatToParts(this); const m = {};
          for (const p of parts) m[p.type] = p.value;
          const hour = m.hour === "24" ? "00" : m.hour;
          const asUTC = Date.UTC(+m.year, +m.month - 1, +m.day, +hour, +m.minute, +m.second);
          return Math.round((this.getTime() - asUTC) / 60000);
        } catch { return origOff.call(this); }
      }, origOff, "getTimezoneOffset", 0);
    }
  })();

  (function patchRTC() {
    if (!enabled("webrtc")) return;
    const RTC = window.RTCPeerConnection;
    if (typeof RTC !== "function") return;
    const Patched = function (...args) {
      if (!CFG.profile) return new RTC(...args);
      const cfg = args[0] ? { ...args[0] } : {};
      cfg.iceTransportPolicy = "relay";
      return new RTC(cfg, ...args.slice(1));
    };
    mimic(Patched, RTC, "RTCPeerConnection", 0);
    Patched.prototype = RTC.prototype;
    try { Object.defineProperty(RTC.prototype, "constructor", { value: Patched, configurable: true, writable: true }); } catch {}
    try { window.RTCPeerConnection = Patched; } catch {}
  })();
})();
