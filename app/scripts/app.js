window.addEventListener('WebComponentsReady', () => {
  'use strict';

  const app = Polymer.dom(document).querySelector('x-app');
  const swCache = Polymer.dom(document).querySelector('platinum-sw-cache');

  document.addEventListener('service-worker-installed', () => {
    // Check to make sure caching is actually enabled—it won't be in the dev
    // environment.
    if (!swCache.disabled) {
      app.showToast('Caching complete! This app will work offline.');
    }
  });

  window.app = app;
});
