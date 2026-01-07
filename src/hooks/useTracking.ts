import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initFacebookPixel, trackPageView } from '@/lib/tracking';

export const useTracking = () => {
  const location = useLocation();

  // Initialize pixel on mount
  useEffect(() => {
    initFacebookPixel();
  }, []);

  // Track page view on route change
  useEffect(() => {
    trackPageView();
  }, [location.pathname]);
};
