import { useEffect } from 'react';

/**
 * Internal, updates CSS variable with the current window height
 * upon window resize event.
 */
export const useUpdateAppHeightOnResize = () => {
  useEffect(() => {
    /*
     * Get the actual rendered window height to set the container size properly.
     * In some browsers (like Safari) the nav bar can override the app.
     */
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
      
      // Also set visual viewport height for mobile keyboard handling
      if (window.visualViewport) {
        doc.style.setProperty('--visual-viewport-height', `${window.visualViewport.height}px`);
      }
    };

    const handleViewportChange = () => {
      const doc = document.documentElement;
      if (window.visualViewport) {
        doc.style.setProperty('--visual-viewport-height', `${window.visualViewport.height}px`);
      }
    };

    setAppHeight();

    window.addEventListener('resize', setAppHeight);
    
    // Listen to visual viewport changes (handles keyboard show/hide on mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }
    
    return () => {
      window.removeEventListener('resize', setAppHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);
};
