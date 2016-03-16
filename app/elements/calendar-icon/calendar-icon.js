(function () {
'use strict';

Polymer({
  is: 'calendar-icon',

  properties: {
    color: {
      type: String,
      value: '#bbb',
    },
    icon: {
      type: String,
      value: 'ticktock:calendar',
    },
    faded: {
      type: Boolean,
      value: false,
    },
  },
});

})();
