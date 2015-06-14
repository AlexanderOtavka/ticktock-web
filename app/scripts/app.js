/**
 * @license Copyright (c) 2015 Drake Developers Club. All rights reserved.
 */
/**
 * app.js
 *
 * Control the main dom-bind template.
 *
 * @author Alexander Otavka (zotavka@gmail.com)
 */


(function() {
  'use strict';

  var app = document.querySelector('#app');

  app.addEventListener('dom-change', function() {
    console.log('app dom loaded');
  });

  window.addEventListener('WebComponentsReady', function() {
    console.log('web components are ready');
  });
})();
