'use strict';

window.$buoop = {
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

// jshint ignore:start
// jscs:disable
function $buo_f(){
 var e = document.createElement("script");
 e.src = "//browser-update.org/update.min.js";
 document.body.appendChild(e);
};
try {document.addEventListener("DOMContentLoaded", $buo_f,false)}
catch(e){window.attachEvent("onload", $buo_f)}
// jscs:enable
// jshint ignore:end
