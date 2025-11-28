import React, { useEffect, useState } from 'react';

/**
 * Offline Indicator Component
 * Shows when user is offline/online
 */
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification && isOnline) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        showNotification ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          isOnline
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        <div className="relative">
          {isOnline ? (
            <i className="fas fa-wifi text-xl"></i>
          ) : (
            <i className="fas fa-wifi-slash text-xl"></i>
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">
            {isOnline ? 'অনলাইনে ফিরে এসেছেন' : 'আপনি অফলাইনে আছেন'}
          </p>
          <p className="text-xs opacity-90">
            {isOnline
              ? 'ইন্টারনেট সংযোগ পুনরুদ্ধার হয়েছে'
              : 'কিছু ফিচার সীমিত হতে পারে'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
