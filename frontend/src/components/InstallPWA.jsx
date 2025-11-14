import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Check } from 'lucide-react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState('desktop');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/.test(userAgent);
      const isIOS = /iphone|ipad|ipod/.test(userAgent);

      if (isIOS) {
        setPlatform('ios');
      } else if (isMobile) {
        setPlatform('mobile');
      } else {
        setPlatform('desktop');
      }

      return { isMobile, isIOS };
    };

    const standalone = checkStandalone();
    const { isMobile, isIOS } = detectPlatform();

    // Don't show banner if already installed
    if (standalone) {
      return;
    }

    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Show again after 1 day if dismissed
    if (dismissed && (Date.now() - dismissedTime < oneDayInMs)) {
      return;
    }

    // iOS doesn't support beforeinstallprompt, show manual instructions
    if (isIOS) {
      // Show iOS install instructions after a short delay
      setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
      return;
    }

    // Listen for the install prompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);

      // Show banner after a short delay (better UX)
      setTimeout(() => {
        setShowInstallBanner(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful app install
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      setInstallSuccess(true);

      // Show success message briefly
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
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`[PWA] User response: ${outcome}`);

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }

      // Clear the deferred prompt
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    } catch (error) {
      console.error('[PWA] Install error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Remember dismissal for 1 day
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Don't render anything if already installed
  if (isStandalone) {
    return null;
  }

  // Success notification
  if (installSuccess) {
    return (
      <div className="fixed top-4 right-4 z-50 animate-fade-in">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3 shadow-xl backdrop-blur-sm">
          <Check className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-400 font-medium">App Installed Successfully!</p>
            <p className="text-gray-400 text-sm">You can now use FX Metrics offline</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show banner if dismissed or no prompt
  if (!showInstallBanner) {
    return null;
  }

  // iOS Install Instructions
  if (platform === 'ios') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
        <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-xl p-4 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
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

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Check className="w-4 h-4 text-violet-400" />
            <span>Works offline • Faster loading • App-like experience</span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop/Android Install Banner
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-xl p-4 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
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
                Get instant access with offline support and faster performance
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
      </div>
    </div>
  );
};

export default InstallPWA;
