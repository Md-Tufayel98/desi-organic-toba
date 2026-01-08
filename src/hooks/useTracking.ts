import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/tracking';

export const useTracking = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Track page view on route change.
  // If the Pixel snippet in index.html is blocked (e.g. CSP), we still fire PageView once from the app.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      if (typeof window !== 'undefined' && !(window as any).fbq) {
        trackPageView();
      }

      return;
    }

    trackPageView();
  }, [location.pathname]);
};

