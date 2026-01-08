// Meta (Facebook) Pixel bootstrapper
// Keeps Pixel working even when inline scripts are blocked by CSP.

export const FB_PIXEL_ID = '1392740588528295';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export const ensureMetaPixel = () => {
  if (typeof window === 'undefined') return;

  // Already initialized (either by index.html or by a previous call)
  if (window.fbq) return;

  // Create the fbq stub (same behavior as Meta's snippet)
  const fbq: any = function (...args: any[]) {
    if (fbq.callMethod) {
      fbq.callMethod.apply(fbq, args);
    } else {
      fbq.queue.push(args);
    }
  };

  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  // Load Meta's library if it's not already present
  const alreadyLoaded = document.querySelector(
    'script[src="https://connect.facebook.net/en_US/fbevents.js"]'
  );

  if (!alreadyLoaded) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  // Initialize Pixel ID
  try {
    window.fbq('init', FB_PIXEL_ID);
  } catch {
    // ignore
  }
};
