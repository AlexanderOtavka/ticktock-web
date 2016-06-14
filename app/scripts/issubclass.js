'use strict';

function issubclass(Sub, Super) {
  return Sub === Super || Sub.prototype instanceof Super;
}

window.issubclass = issubclass;
