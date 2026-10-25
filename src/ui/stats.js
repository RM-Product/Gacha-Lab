// Anonymous counters for the live site: event names go to the site's own /api/e (server/functions/api/e.js). No
// cookies, no identifiers, only daily totals. Only on the site's own address (and its preview copies), and off for
// automated test browsers unless the link has ?gltest=1. Links can carry ?ref=<name> (or utm_source) to label where
// visitors came from.

export const LIVE_HOST = /(^|\.)thegachalab\.pages\.dev$/;

// Whether this page counts anything: never in the private preview, a local copy or a file.
export function trackingOn({ hostname, search, protocol }, webdriver) {
  if (protocol === 'file:' || !LIVE_HOST.test(hostname || '')) return false;
  return /[?&]gltest=1(&|$)/.test(search || '') || !webdriver;
}

// What every event carries: the referring site and a ?ref= tag (where visitors came from), and whether a
// "Macintosh" has a touch screen (an iPad asking for the desktop site).
export function sourceQuery({ referrer, search, userAgent, maxTouchPoints }) {
  let host = '';
  let ref = '';
  try {
    host = referrer ? new URL(referrer).hostname : '';
  } catch {
    // no usable referrer
  }
  try {
    const p = new URLSearchParams(search || '');
    ref = p.get('ref') || p.get('utm_source') || '';
  } catch {
    // no tag
  }
  const touchMac = /Macintosh/.test(userAgent || '') && maxTouchPoints > 1;
  return `&s=${encodeURIComponent(host)}${ref ? `&r=${encodeURIComponent(ref.slice(0, 40))}` : ''}${touchMac ? '&tp=1' : ''}`;
}

// `track(ev, detail)` counts every time; `once(ev)` only the first time in a visit; `time(secs)` adds visible seconds.
export function createTracker({ on, query, send }) {
  const seen = new Set();
  const go = (ev, extra = '') => {
    if (on) send(`/api/e?ev=${ev}${extra}${query}`);
  };
  return {
    track: (ev, detail) => go(ev, detail ? `&d=${encodeURIComponent(detail)}` : ''),
    once(ev) {
      if (seen.has(ev)) return;
      seen.add(ev);
      go(ev);
    },
    time: (secs) => {
      if (secs > 0) go('time', `&t=${secs}`);
    },
  };
}

// Sends one event without holding up the page, even while it closes.
export function beacon(url) {
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url)) return;
  } catch {
    // fall back to fetch
  }
  try {
    fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
  } catch {
    // not counted
  }
}

// Time on the page: visible seconds, sent once a minute while visible and again when the page is hidden or closed,
// so a lost "leaving" beacon only drops the last minute.
export function countVisibleTime(stats) {
  let shownAt = document.visibilityState === 'hidden' ? 0 : Date.now();
  const flush = (stillVisible) => {
    if (!shownAt) return;
    const now = Date.now();
    const secs = Math.round((now - shownAt) / 1000);
    shownAt = stillVisible ? now : 0;
    stats.time(secs);
  };
  setInterval(() => {
    if (document.visibilityState === 'visible') flush(true);
  }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(false);
    else if (!shownAt) shownAt = Date.now();
  });
  window.addEventListener('pagehide', () => flush(false));
}
