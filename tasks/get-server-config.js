'use strict';

let historyApiFallback = require('connect-history-api-fallback');
let proxy = require('proxy-middleware');
let url = require('url');

module.exports = (port, apiPort, baseDir, routes, browser) => {
  let proxyOptions = url.parse(`http://localhost:${apiPort}/_ah`);
  proxyOptions.route = '/_ah';

  return {
    port,
    browser: browser || 'default',
    notify: false,
    logPrefix: 'Tock',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: snippet => snippet,
      },
    },

    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir,
      routes,
      middleware: [proxy(proxyOptions), historyApiFallback()],
    },
  };
};
