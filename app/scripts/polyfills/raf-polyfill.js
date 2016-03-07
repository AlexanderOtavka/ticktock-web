// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-
// smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
// further modified by Zander Otavka

(function () {
  'use strict';

  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x] + 'CancelAnimationFrame'] ||
      window[vendors[x] + 'RequestCancelAnimationFrame'];
  }

  var getPerfNow;
  var t0;
  if (performance && performance.now) {
    getPerfNow = function () {
      return performance.now();
    };
  } else if (Date.now) {
    t0 = Date.now();
    getPerfNow = function () {
      return Date.now() - t0;
    };
  } else {
    t0 = new Date().getTime();
    getPerfNow = function () {
      return new Date().getTime() - t0;
    };
  }

  if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
    window.requestAnimationFrame = function (callback) {
      return window.setTimeout(function () {
        callback(getPerfNow());
      }, 16);
    };

    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
      };
    }
  }
}());
