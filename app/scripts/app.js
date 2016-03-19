(function () {
'use strict';

document.addEventListener('service-worker-installed', () => {
  const swCache = Polymer.dom(document).querySelector('platinum-sw-cache');
  const toast = Polymer.dom(document).querySelector('#cachingComplete');

  // Check to make sure caching is actually enabled—it won't be in the dev
  // environment.
  if (!swCache.disabled) {
    toast.show();
  }
});

})();
