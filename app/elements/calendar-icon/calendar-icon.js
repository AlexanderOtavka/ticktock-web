(function () {
  'use strict';

  class CalendarIcon {
    beforeRegister() {
      this.is = 'calendar-icon';
      this.properties = {
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
      };
    }
  }

  Polymer(CalendarIcon);
})();
