// Facebook Pixel Tracking - Consolidated Tracking File
// Pixel ID: 1392740588528295

const FB_PIXEL_ID = '1392740588528295';
const FB_ACCESS_TOKEN = 'EAAMg0F4WL88BQVSZC6XhChSRzwUIwUannO6tPm1FS0Y4TAdU0TOK14keuRZC6KZCg3ZBK8aCZB95OqX11DSphDBTbYbyxSmZB45tik9BeZAYE3mnBTeE0LSz6UsNBb1M9Ho6AslOlfSYOyrgjm0oFPKtXZBErL4ObK7L4xwR1ZA3DkBA62lxpOxb4ZAQAXfP6u5AZDZD';

// SHA-256 hash function for customer data
const sha256Hash = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Normalize phone number to E.164 format for Bangladesh
const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+88')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('88')) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return `880${cleaned}`;
};

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

// ==========================================
// EVENT 1: PageView
// ==========================================
export const trackPageView = () => {
  if ((window as any).fbq) {
    (window as any).fbq('track', 'PageView');
  }
};

// ==========================================
// EVENT 2: ViewContent (Product View)
// ==========================================
export const trackViewContent = (data: {
  content_name: string;
  content_ids: string[];
  content_type?: string;
  value: number;
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

// ==========================================
// EVENT 3: AddToCart
// ==========================================
export const trackAddToCart = (data: {
  content_name: string;
  content_ids: string[];
  content_type?: string;
  value: number;
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

// ==========================================
// EVENT 4: Purchase (with hashed customer data)
// ==========================================
export interface PurchaseData {
  content_ids: string[];
  contents: Array<{ id: string; quantity: number; item_price?: number }>;
  num_items: number;
  value: number;
  currency?: string;
  // Customer data for Advanced Matching (will be hashed)
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  customer_city?: string;
  customer_postal_code?: string;
  order_id?: string;
}

export const trackPurchase = async (data: PurchaseData) => {
  if (!(window as any).fbq) return;

  // Build the base purchase event data
  const eventData: any = {
    content_ids: data.content_ids,
    contents: data.contents,
    content_type: 'product',
    num_items: data.num_items,
    value: data.value,
    currency: data.currency || 'BDT',
  };

  // Add order_id if available
  if (data.order_id) {
    eventData.order_id = data.order_id;
  }

  // Prepare user data for Advanced Matching (hashed)
  const userData: any = {};

  try {
    // Hash customer phone (em = email, ph = phone, fn = first name, ln = last name)
    if (data.customer_phone) {
      const normalizedPhone = normalizePhone(data.customer_phone);
      userData.ph = await sha256Hash(normalizedPhone);
    }

    // Hash customer email
    if (data.customer_email) {
      userData.em = await sha256Hash(data.customer_email);
    }

    // Hash customer name (split into first and last name)
    if (data.customer_name) {
      const nameParts = data.customer_name.trim().split(' ');
      if (nameParts.length > 0) {
        userData.fn = await sha256Hash(nameParts[0]);
      }
      if (nameParts.length > 1) {
        userData.ln = await sha256Hash(nameParts.slice(1).join(' '));
      }
    }

    // Hash city
    if (data.customer_city) {
      userData.ct = await sha256Hash(data.customer_city);
    }

    // Hash postal code (if available)
    if (data.customer_postal_code) {
      userData.zp = await sha256Hash(data.customer_postal_code);
    }

    // Country code for Bangladesh
    userData.country = await sha256Hash('bd');

  } catch (error) {
    console.error('Error hashing user data:', error);
  }

  // Fire the Purchase event with user data
  if (Object.keys(userData).length > 0) {
    // Set user data for Advanced Matching
    (window as any).fbq('init', FB_PIXEL_ID, userData);
  }

  // Track the Purchase event
  (window as any).fbq('track', 'Purchase', eventData);
};

// ==========================================
// Tracking Hook for automatic PageView
// ==========================================
export { FB_PIXEL_ID, FB_ACCESS_TOKEN };
