// Google Analytics utility functions

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_TRACKING_ID = 'G-6T26W6CFS4';

/**
 * Track a page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: path,
      page_title: title,
    });
  }
};

/**
 * Track an event
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Track a click event
 */
export const trackClick = (element: string, location?: string) => {
  trackEvent('click', 'engagement', `${element}${location ? ` - ${location}` : ''}`);
};

/**
 * Track a link click
 */
export const trackLinkClick = (url: string, text?: string) => {
  trackEvent('click', 'link', text || url, undefined);
};

/**
 * Track a button click
 */
export const trackButtonClick = (buttonText: string, location?: string) => {
  trackEvent('click', 'button', `${buttonText}${location ? ` - ${location}` : ''}`);
};

/**
 * Track form submission
 */
export const trackFormSubmit = (formName: string, success: boolean = true) => {
  trackEvent('submit', 'form', formName, success ? 1 : 0);
};

/**
 * Track newsletter signup
 */
export const trackNewsletterSignup = (success: boolean = true) => {
  trackEvent('signup', 'newsletter', success ? 'success' : 'error');
};

