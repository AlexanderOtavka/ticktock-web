!function(){"use strict";var t=function(t){if(t=t||{},!(t instanceof Object))throw new TypeError("Invalid argument to Class.");if(t.hasOwnProperty("constructor")&&!(t.constructor instanceof Function))throw new TypeError("Class constructor must be a function.");if(t.hasOwnProperty("extends")&&!(t["extends"]instanceof Function))throw new TypeError("Class must extend a function.");if(t.hasOwnProperty("static")&&!(t["static"]instanceof Object))throw new TypeError("Invalid static property for Class.");var n;n=t.hasOwnProperty("constructor")?t.constructor:function(){n["super"].constructor.call(this)};var r,o=Object.keys(t),e=o.indexOf("extends");-1!==e?(r=t["extends"],o.splice(e,1)):r=Object,n.prototype=Object.create(r.prototype),n["super"]=r.prototype;var c=o.indexOf("static");return-1!==c&&(Object.keys(t["static"]).forEach(function(r){var o=t["static"][r];o instanceof Function?n[r]=o.bind(n):n[r]=o}),o.splice(c,1)),o.forEach(function(r){n.prototype[r]=t[r]}),n};window.Class=t}();