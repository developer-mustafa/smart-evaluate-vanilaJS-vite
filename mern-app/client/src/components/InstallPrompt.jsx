import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';

/**
 * PWA Install Prompt Component
 * Shows custom install UI for Progressive Web App
 */
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (new Date() - dismissedDate) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        return; // Don't show again for 30 days
      }
    }

    // Listen for beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-download text-primary"></i>
              <h3 className="font-semibold text-card-foreground">অ্যাপ ইনস্টল করুন</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              দ্রুত অ্যাক্সেসের জন্য আপনার হোম স্ক্রিনে স্মার্ট ইভ্যালুয়েটর যোগ করুন
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm">
                ইনস্টল করুন
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm">
                পরে
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
