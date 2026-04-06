(function() {
  const script = document.currentScript;
  const siteId = script ? script.getAttribute('data-site-id') : null;
  if (!siteId) return console.warn('[Noctra] Missing data-site-id');

  const API_ENDPOINT = new URL(script.src).origin + '/api/collect';
  const sessionId = Math.random().toString(36).substring(2, 15);
  
  let vitals = {
    lcp_ms: null,
    cls_score: 0,
    inp_ms: null,
    fcp_ms: null,
    ttfb_ms: null
  };

  const send = (event, data = {}) => {
    const payload = JSON.stringify({
      site_id: siteId,
      session_id: sessionId,
      event,
      path: window.location.pathname,
      ts: new Date().toISOString(),
      ...data
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(API_ENDPOINT, payload);
    } else {
      fetch(API_ENDPOINT, { method: 'POST', body: payload, keepalive: true });
    }
  };

  // 1. Initial Pageview
  const device = {
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    screen_width: window.innerWidth,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  const traffic = {
    referrer: document.referrer,
    utm_source: new URLSearchParams(window.location.search).get('utm_source'),
    utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
  };

  send('pageview', { device, traffic });

  // 2. Web Vitals capturing
  try {
    // FCP & TTFB
    const perfData = window.performance.getEntriesByType('navigation')[0];
    if (perfData) {
      vitals.ttfb_ms = Math.round(perfData.responseStart);
    }
    
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          vitals.fcp_ms = Math.round(entry.startTime);
        }
      }
    }).observe({ type: 'paint', buffered: true });

    // LCP
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      vitals.lcp_ms = Math.round(lastEntry.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // CLS
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          vitals.cls_score += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });

    // INP (Approximation via event timing)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'pointerdown' || entry.name === 'click' || entry.name === 'keydown') {
          const delay = entry.processingEnd - entry.startTime;
          vitals.inp_ms = Math.max(vitals.inp_ms || 0, Math.round(delay));
        }
      });
    }).observe({ type: 'event', buffered: true });

  } catch (e) {
    console.error('[Noctra] Vitals error:', e);
  }

  // 3. Periodic updates for vitals and engagement
  let timeStart = Date.now();
  const flushVitals = () => {
    if (vitals.lcp_ms || vitals.cls_score > 0) {
      send('vitals', { vitals });
    }
  };

  const flushEngagement = () => {
    const timeOnPage = Math.round((Date.now() - timeStart) / 1000);
    const scrollDepth = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    send('engagement', { 
      behavior: { 
        time_on_page: timeOnPage, 
        scroll_depth: scrollDepth,
        is_bounce: timeOnPage < 5 
      } 
    });
  };

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushVitals();
      flushEngagement();
    }
  });

  window.addEventListener('pagehide', () => {
    flushVitals();
    flushEngagement();
  });

})();
