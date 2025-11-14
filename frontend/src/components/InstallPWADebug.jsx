import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Check, AlertCircle } from 'lucide-react';

const InstallPWADebug = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState('desktop');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log('[PWA Debug] Component mounted');

    // Check if already installed (standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');

      console.log('[PWA Debug] Standalone mode:', isStandaloneMode);
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/.test(userAgent);
      const isIOS = /iphone|ipad|ipod/.test(userAgent);

      let detectedPlatform = 'desktop';
      if (isIOS) {
        detectedPlatform = 'ios';
      } else if (isMobile) {
        detectedPlatform = 'mobile';
      }

      console.log('[PWA Debug] Platform detected:', detectedPlatform);
      console.log('[PWA Debug] User agent:', userAgent);
      setPlatform(detectedPlatform);

      setDebugInfo({
        userAgent,
        isMobile,
        isIOS,
        platform: detectedPlatform,
        isChrome: /chrome/.test(userAgent),
        isEdge: /edge/.test(userAgent),
        isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent)
      });

      return { isMobile, isIOS };
    };

    const standalone = checkStandalone();
    const { isMobile, isIOS } = detectPlatform();

    console.log('[PWA Debug] Already installed?', standalone);

    // FORCE SHOW BANNER FOR DEBUGGING (remove in production)
    if (!standalone) {
      // Check dismissal
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      console.log('[PWA Debug] Previously dismissed?', dismissed);

      // For iOS, always show after delay
      if (isIOS) {
        console.log('[PWA Debug] iOS detected - will show instructions');
        setTimeout(() => {
          console.log('[PWA Debug] Showing iOS banner');
          setShowInstallBanner(true);
        }, 3000);
        return;
      }

      // For debugging: Show banner even without beforeinstallprompt
      console.log('[PWA Debug] Will show banner in 3 seconds (debug mode)');
      setTimeout(() => {
        console.log('[PWA Debug] Showing debug banner');
        setShowInstallBanner(true);
      }, 3000);
    }

    // Listen for the install prompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWA Debug] beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful app install
    const handleAppInstalled = () => {
      console.log('[PWA Debug] appinstalled event fired!');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setInstallSuccess(true);

      setTimeout(() => {
        setInstallSuccess(false);
      }, 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('[PWA Debug] Install button clicked');

    if (!deferredPrompt) {
      console.log('[PWA Debug] No deferred prompt available - this is a Chrome/Edge feature');
      alert('Install feature requires Chrome or Edge browser on desktop, or Chrome on Android.\n\n' +
            'Current browser: ' + navigator.userAgent);
      return;
    }

    setIsInstalling(true);

    try {
      console.log('[PWA Debug] Showing install prompt');
      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA Debug] User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('[PWA Debug] User accepted install');
      } else {
        console.log('[PWA Debug] User dismissed install');
      }

      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } catch (error) {
      console.error('[PWA Debug] Install error:', error);
      alert('Installation error: ' + error.message);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    console.log('[PWA Debug] Banner dismissed by user');
    setShowInstallBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleForceShow = () => {
    console.log('[PWA Debug] Force showing banner');
    localStorage.removeItem('pwa-install-dismissed');
    setShowInstallBanner(true);
  };

  // Debug panel (always visible in this debug version)
  if (true) { // Always show debug info
    return (
      <>
        {/* Debug Panel */}
        <div className="fixed top-4 right-4 z-[100] bg-slate-900/95 border border-violet-500/30 rounded-lg p-4 max-w-md backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-violet-400" />
              PWA Debug Info
            </h3>
          </div>

          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex justify-between">
              <span>Standalone Mode:</span>
              <span className={isStandalone ? 'text-green-400' : 'text-red-400'}>
                {isStandalone ? '✓ Installed' : '✗ Not Installed'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Platform:</span>
              <span className="text-violet-400">{platform}</span>
            </div>
            <div className="flex justify-between">
              <span>Install Prompt:</span>
              <span className={deferredPrompt ? 'text-green-400' : 'text-amber-400'}>
                {deferredPrompt ? '✓ Available' : '⚠ Not Available'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Banner Visible:</span>
              <span className={showInstallBanner ? 'text-green-400' : 'text-gray-400'}>
                {showInstallBanner ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            {debugInfo.userAgent && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <div className="text-gray-400 mb-1">Browser:</div>
                <div className="text-[10px] text-gray-500 break-all">
                  {debugInfo.userAgent.substring(0, 100)}...
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
            <button
              onClick={handleForceShow}
              className="w-full px-3 py-2 bg-violet-600 text-white rounded text-xs hover:bg-violet-500 transition-colors"
            >
              Force Show Banner
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('pwa-install-dismissed');
                window.location.reload();
              }}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded text-xs hover:bg-slate-600 transition-colors"
            >
              Clear Cache & Reload
            </button>
          </div>

          <div className="mt-2 text-[10px] text-gray-500">
            Check browser console for detailed logs
          </div>
        </div>

        {/* Success notification */}
        {installSuccess && (
          <div className="fixed top-4 left-4 z-50 animate-fade-in">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 shadow-xl backdrop-blur-sm">
              <Check className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">App Installed Successfully!</p>
                <p className="text-gray-400 text-sm">You can now use FX Metrics offline</p>
              </div>
            </div>
          </div>
        )}

        {/* Install Banner */}
        {showInstallBanner && !isStandalone && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
            <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-xl p-4 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
              {platform === 'ios' ? (
                // iOS Instructions
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-violet-500/20 p-2 rounded-lg">
                        <Smartphone className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Install FX Metrics</h3>
                        <p className="text-gray-400 text-sm">Add to your home screen</p>
                      </div>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                    <p className="flex items-center gap-2">
                      <span className="bg-violet-500/30 text-violet-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      Tap the <strong className="text-white">Share</strong> button in Safari
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="bg-violet-500/30 text-violet-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      Select <strong className="text-white">"Add to Home Screen"</strong>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="bg-violet-500/30 text-violet-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      Tap <strong className="text-white">"Add"</strong> to install
                    </p>
                  </div>
                </>
              ) : (
                // Desktop/Android Banner
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="bg-violet-500/20 p-2 rounded-lg">
                      {platform === 'desktop' ? (
                        <Monitor className="w-6 h-6 text-violet-400" />
                      ) : (
                        <Smartphone className="w-6 h-6 text-violet-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">Install FX Trade Metrics</h3>
                      <p className="text-gray-400 text-sm">
                        {deferredPrompt
                          ? 'Get instant access with offline support and faster performance'
                          : 'This feature works best in Chrome or Edge browser'
                        }
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-violet-400" />
                          Works offline
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-violet-400" />
                          Faster loading
                        </span>
                        <span className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-violet-400" />
                          Desktop shortcut
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                      Not now
                    </button>
                    <button
                      onClick={handleInstallClick}
                      disabled={isInstalling}
                      className="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-500 hover:to-purple-500 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      {isInstalling ? 'Installing...' : 'Install'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export default InstallPWADebug;
