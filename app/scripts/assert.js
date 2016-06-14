'use strict';

if (DEV) {
  window.assert = (condition, message) => {
    if (!condition) {
      let errMessage = 'Assertion Error';
      if (message) {
        errMessage += `: ${message}`;
      }

      throw new Error(errMessage);
    }
  };
} else {
  window.assert = () => {};
}
