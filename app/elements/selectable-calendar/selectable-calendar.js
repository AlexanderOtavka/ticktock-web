(function () {
'use strict';

Polymer({
  is: 'selectable-calendar',

  properties: {
    color: String,
    icon: {
      type: String,
      value: '',
    },
    name: String,
    calendarId: String,
    calendarHidden: {
      type: Boolean,
      notify: true,
      value: false,
    },
    noMenu: Boolean,
  },

  attached() {
    this.$$('dropdown-menu').onclick = event => {
      event.stopPropagation();
      return false;
    };
  },

  toggleHide(event) {
    this.calendarHidden = !this.calendarHidden;
    event.stopPropagation();
  },

  _getIcon(icon, calendarHidden) {
    return icon || (calendarHidden ? 'ticktock:calendar-hidden' :
                                     'ticktock:calendar');
  },

  _getHideButtonText(calendarHidden) {
    return calendarHidden ? 'Unhide' : 'Hide';
  },

  _getHiddenClass(calendarHidden) {
    return calendarHidden ? 'hidden' : '';
  },
});

})();
