/**
 * Push Notification Service
 * Handles browser push notifications for PWA
 */

const PUBLIC_VAPID_KEY = 'YOUR_PUBLIC_VAPID_KEY_HERE'; // Replace with your actual key

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Notifications are not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async () => {
  if (!isNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }

    // Send subscription to backend
    await sendSubscriptionToBackend(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      // Remove subscription from backend
      await removeSubscriptionFromBackend(subscription);
    }
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

/**
 * Show a local notification
 */
export const showLocalNotification = (title, options = {}) => {
  if (!isNotificationSupported()) {
    return;
  }

  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/icons/icon-192x192.png',
        badge: options.badge || '/icons/icon-72x72.png',
        vibrate: options.vibrate || [200, 100, 200],
        tag: options.tag || 'default',
        data: options.data || {},
        actions: options.actions || [],
        ...options,
      });
    });
  }
};

/**
 * Send subscription to backend
 */
const sendSubscriptionToBackend = async (subscription) => {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send subscription to backend');
    }
  } catch (error) {
    console.error('Error sending subscription to backend:', error);
  }
};

/**
 * Remove subscription from backend
 */
const removeSubscriptionFromBackend = async (subscription) => {
  try {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove subscription from backend');
    }
  } catch (error) {
    console.error('Error removing subscription from backend:', error);
  }
};

/**
 * Convert base64 string to Uint8Array
 */
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
};

export default {
  isNotificationSupported,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showLocalNotification,
};
