'use strict';

let config = {
  vs: {
    i: 9,
    f: 29,
    c: 33,
    s: 6,
    o: 22,
  },
  text: 'Your browser, %s, is <b>out of date</b>. TickTock may not work ' +
        'properly.  Please <a %s>update your browser</a> for the best ' +
        'experience here.',
};

try {
  document.addEventListener('DOMContentLoaded', loadBrowserUpdate, false);
} catch (e) {
  window.attachEvent('onload', loadBrowserUpdate);
}

function loadBrowserUpdate() {
  let e = document.createElement('script');
  e.src = 'https://browser-update.org/update.min.js';
  document.body.appendChild(e);
}

window.$buoop = config;
