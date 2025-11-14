/**
 * Register the service worker for PWA functionality
 */
export const registerServiceWorker = async () => {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return;
  }

  try {
    // Wait for page load before registering
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('[PWA] Service worker registered:', registration.scope);

    // Check for updates on page load
    registration.update();

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[PWA] New service worker found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA] New service worker installed, update available');

          // Notify user that an update is available
          if (window.confirm('A new version is available! Click OK to update.')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Handle controller change (new service worker activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] New service worker activated');
      // Could show a notification here
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
  }
};

/**
 * Unregister all service workers (useful for debugging)
 */
export const unregisterServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      await registration.unregister();
      console.log('[PWA] Service worker unregistered');
    }

    // Clear all caches
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[PWA] All caches cleared');
  } catch (error) {
    console.error('[PWA] Error unregistering service worker:', error);
  }
};

/**
 * Check if the app is running in standalone mode (already installed)
 */
export const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

/**
 * Check if the app is installable
 */
export const canInstall = () => {
  // iOS devices require manual installation
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

  // Chrome/Edge support beforeinstallprompt
  const supportsInstallPrompt = 'BeforeInstallPromptEvent' in window;

  return isIOS || supportsInstallPrompt;
};

/**
 * Get platform information
 */
export const getPlatformInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /mobile/.test(userAgent);
  const isDesktop = !isMobile;

  const browser = (() => {
    if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) return 'chrome';
    if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) return 'safari';
    if (/firefox/.test(userAgent)) return 'firefox';
    if (/edge/.test(userAgent)) return 'edge';
    return 'other';
  })();

  return {
    isIOS,
    isAndroid,
    isMobile,
    isDesktop,
    browser,
    isStandalone: isStandalone(),
    canInstall: canInstall()
  };
};
