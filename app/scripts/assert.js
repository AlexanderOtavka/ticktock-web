'use strict';

const { DEV } = ticktock;

if (DEV) {
  window.assert = condition => {
    if (!condition) {
      throw new Error('Assertion Error');
    }
  };
} else {
  window.assert = () => {};
}
