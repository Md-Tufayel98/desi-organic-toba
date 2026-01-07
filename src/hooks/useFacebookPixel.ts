import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initFacebookPixel,
  trackPageView,
  trackTimeOnPage,
  trackPageScroll,
  trackInternalClick,
} from '@/lib/facebook-pixel';

export const useFacebookPixel = () => {
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const scrollMilestonesRef = useRef<Set<number>>(new Set());

  // Initialize pixel and track page views
  useEffect(() => {
    initFacebookPixel();
  }, []);

  // Track page view on route change
  useEffect(() => {
    trackPageView();
    // Reset tracking for new page
    startTimeRef.current = Date.now();
    scrollMilestonesRef.current = new Set();
  }, [location.pathname]);

  // Track time on page
  useEffect(() => {
    const intervals = [30, 60, 120, 300]; // Track at 30s, 1min, 2min, 5min
    const trackedIntervals = new Set<number>();

    const intervalId = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      intervals.forEach((interval) => {
        if (timeSpent >= interval && !trackedIntervals.has(interval)) {
          trackedIntervals.add(interval);
          trackTimeOnPage(interval);
        }
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [location.pathname]);

  // Track scroll depth
  useEffect(() => {
    const milestones = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !scrollMilestonesRef.current.has(milestone)) {
          scrollMilestonesRef.current.add(milestone);
          trackPageScroll(milestone);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  // Track internal clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      const button = target.closest('button');
      
      if (link && link.href && link.href.startsWith(window.location.origin)) {
        trackInternalClick({
          element_name: link.textContent?.trim().slice(0, 50) || 'Link',
          element_type: 'link',
          page_location: location.pathname,
        });
      } else if (button) {
        trackInternalClick({
          element_name: button.textContent?.trim().slice(0, 50) || 'Button',
          element_type: 'button',
          page_location: location.pathname,
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [location.pathname]);
};
