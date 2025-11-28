/**
 * Analytics Utility
 * Track page views, events, and user behavior
 */

// Initialize analytics (Google Analytics, Mixpanel, etc.)
let analyticsInitialized = false;

export const initAnalytics = (trackingId) => {
  if (analyticsInitialized) return;
  
  // Example: Google Analytics 4
  if (typeof window !== 'undefined' && trackingId) {
    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', trackingId);

    analyticsInitialized = true;
  }
};

/**
 * Track page view
 */
export const trackPageView = (path, title) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  }
  
  console.log('[Analytics] Page view:', path, title);
};

/**
 * Track custom event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
  
  console.log('[Analytics] Event:', eventName, eventParams);
};

/**
 * Track user interaction
 */
export const trackClick = (elementName, elementType = 'button') => {
  trackEvent('click', {
    element_name: elementName,
    element_type: elementType,
  });
};

/**
 * Track form submission
 */
export const trackFormSubmit = (formName, success = true) => {
  trackEvent('form_submit', {
    form_name: formName,
    success: success,
  });
};

/**
 * Track  search
 */
export const trackSearch = (searchTerm, resultsCount) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
  });
};

/**
 * Track error
 */
export const trackError = (errorMessage, errorType = 'general') => {
  trackEvent('error', {
    error_message: errorMessage,
    error_type: errorType,
  });
};

/**
 * Track performance metrics
 */
export const trackPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;
    const renderTime = perfData.domComplete - perfData.domLoading;

    trackEvent('performance', {
      page_load_time: pageLoadTime,
      connect_time: connectTime,
      render_time: renderTime,
    });
  }
};

/**
 * Set user properties
 */
export const setUserProperties = (userId, properties = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', {
      user_id: userId,
      ...properties,
    });
  }
};

export default {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackClick,
  trackFormSubmit,
  trackSearch,
  trackError,
  trackPerformance,
  setUserProperties,
};
