import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import WalkoutTrackerApp from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WalkoutTrackerApp />
  </React.StrictMode>
);

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('🔄 New version available!');
              
              // Show update notification
              if (confirm('A new version is available! Click OK to update.')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
    
    // Handle service worker controller change
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// PWA Install Prompt Handler
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  console.log('💾 Install prompt available');
  
  // Optionally, show a custom install button
  // You can dispatch a custom event here to show your install UI
  window.dispatchEvent(new Event('pwa-install-available'));
});

// Handle app installed event
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA installed successfully');
  deferredPrompt = null;
});

// Export function to trigger install prompt
window.showInstallPrompt = async () => {
  if (!deferredPrompt) {
    console.log('Install prompt not available');
    return false;
  }
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`User response to install prompt: ${outcome}`);
  
  // Clear the deferred prompt
  deferredPrompt = null;
  
  return outcome === 'accepted';
};

// Detect if running as PWA
window.isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Network status monitoring
window.addEventListener('online', () => {
  console.log('🌐 Back online');
  // Dispatch custom event for app to handle
  window.dispatchEvent(new CustomEvent('network-status', { detail: 'online' }));
});

window.addEventListener('offline', () => {
  console.log('📵 Gone offline');
  // Dispatch custom event for app to handle
  window.dispatchEvent(new CustomEvent('network-status', { detail: 'offline' }));
});

// Log PWA status
console.log('PWA Status:', window.isPWA() ? 'Running as installed app' : 'Running in browser');
console.log('Online Status:', navigator.onLine ? 'Online' : 'Offline');
