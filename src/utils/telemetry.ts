export function initTelemetryObservers(isAnalyticsConsented: () => boolean): () => void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return () => {};
  }

  const sendVital = (name: string, value: number) => {
    if (!isAnalyticsConsented()) return;
    const payload = JSON.stringify({
      name,
      value: Math.round(value * 100) / 100,
      path: window.location.pathname,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry/vitals', new Blob([payload], { type: 'application/json' }));
    }
  };

  let clsValue = 0;
  let lcpValue = 0;
  let inpMax = 0;
  const observers: PerformanceObserver[] = [];

  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) lcpValue = last.startTime;
    });
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
    observers.push(lcpObs);
  } catch {
    // Unsupported browser metric
  }

  try {
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { hadRecentInput?: boolean; value?: number })[]) {
        if (!entry.hadRecentInput && typeof entry.value === 'number') {
          clsValue += entry.value;
        }
      }
    });
    clsObs.observe({ type: 'layout-shift', buffered: true });
    observers.push(clsObs);
  } catch {
    // Unsupported
  }

  try {
    const eventObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { duration?: number })[]) {
        if (typeof entry.duration === 'number' && entry.duration > inpMax) {
          inpMax = entry.duration;
        }
      }
    });
    eventObs.observe({ type: 'event', buffered: true });
    observers.push(eventObs);
  } catch {
    // Unsupported
  }

  const flushVitals = () => {
    if (document.visibilityState === 'hidden') {
      if (lcpValue > 0) sendVital('LCP', lcpValue);
      sendVital('CLS', clsValue);
      if (inpMax > 0) sendVital('INP', inpMax);
    }
  };
  document.addEventListener('visibilitychange', flushVitals);

  const onError = (event: ErrorEvent) => {
    fetch('/api/telemetry/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: event.message || 'Unhandled error',
        route: window.location.pathname,
      }),
    }).catch(() => {});
  };
  window.addEventListener('error', onError);

  return () => {
    observers.forEach((o) => o.disconnect());
    document.removeEventListener('visibilitychange', flushVitals);
    window.removeEventListener('error', onError);
  };
}
