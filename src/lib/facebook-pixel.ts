// Facebook Pixel Tracking Utility
const FB_PIXEL_ID = '1392740588528295';

// Initialize Facebook Pixel
export const initFacebookPixel = () => {
  if (typeof window === 'undefined') return;
  
  // Check if already initialized
  if ((window as any).fbq) return;

  // Facebook Pixel base code
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  (window as any).fbq('init', FB_PIXEL_ID);
  
  // Fire PageView immediately after init
  (window as any).fbq('track', 'PageView');
};

// Track PageView
export const trackPageView = () => {
  if ((window as any).fbq) {
    (window as any).fbq('track', 'PageView');
  }
};

// Track AddToCart
export const trackAddToCart = (data: {
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => {
  if ((window as any).fbq) {
    (window as any).fbq('track', 'AddToCart', {
      content_name: data.content_name,
      content_ids: data.content_ids,
      content_type: data.content_type || 'product',
      value: data.value,
      currency: data.currency || 'BDT',
    });
  }
};

// Track InitiateCheckout
export const trackInitiateCheckout = (data: {
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
  value?: number;
  currency?: string;
}) => {
  if ((window as any).fbq) {
    (window as any).fbq('track', 'InitiateCheckout', {
      content_ids: data.content_ids,
      contents: data.contents,
      num_items: data.num_items,
      value: data.value,
      currency: data.currency || 'BDT',
    });
  }
};

// Track Purchase (Checkout Complete)
export const trackPurchase = (data: {
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
  value: number;
  currency?: string;
}) => {
  if ((window as any).fbq) {
    (window as any).fbq('track', 'Purchase', {
      content_ids: data.content_ids,
      contents: data.contents,
      num_items: data.num_items,
      value: data.value,
      currency: data.currency || 'BDT',
    });
  }
};

// Track ViewContent (Product View)
export const trackViewContent = (data: {
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
}) => {
  if ((window as any).fbq) {
    (window as any).fbq('track', 'ViewContent', {
      content_name: data.content_name,
      content_ids: data.content_ids,
      content_type: data.content_type || 'product',
      value: data.value,
      currency: data.currency || 'BDT',
    });
  }
};

// Custom Events

// Track TimeOnPage
export const trackTimeOnPage = (seconds: number) => {
  if ((window as any).fbq) {
    (window as any).fbq('trackCustom', 'TimeOnPage', {
      time_seconds: seconds,
    });
  }
};

// Track PageScroll
export const trackPageScroll = (percentage: number) => {
  if ((window as any).fbq) {
    (window as any).fbq('trackCustom', 'PageScroll', {
      scroll_percentage: percentage,
    });
  }
};

// Track WatchVideo
export const trackWatchVideo = (data: {
  video_name?: string;
  video_duration?: number;
  watch_percentage?: number;
}) => {
  if ((window as any).fbq) {
    (window as any).fbq('trackCustom', 'WatchVideo', data);
  }
};

// Track InternalClick
export const trackInternalClick = (data: {
  element_name?: string;
  element_type?: string;
  page_location?: string;
}) => {
  if ((window as any).fbq) {
    (window as any).fbq('trackCustom', 'InternalClick', data);
  }
};

// Track Search
export const trackSearch = (searchQuery: string) => {
  if ((window as any).fbq) {
    (window as any).fbq('track', 'Search', {
      search_string: searchQuery,
    });
  }
};
