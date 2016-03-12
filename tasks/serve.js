'use strict';

var browserSync = require('browser-sync');
var historyApiFallback = require('connect-history-api-fallback');
var proxy = require('proxy-middleware');
var proxyOptions = require('url').parse('http://localhost:8080/_ah');
proxyOptions.route = '/_ah';

var serve = function (port, baseDir) {
  browserSync({
    port: port,
    notify: false,
    logPrefix: 'Tock',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        },
      },
    },

    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: baseDir,
      middleware: [proxy(proxyOptions), historyApiFallback()],
    },
  });
};

serve.reload = function () {
  return browserSync.reload;
};

serve.isActive = function () {
  return browserSync.active;
};

module.exports = serve;
