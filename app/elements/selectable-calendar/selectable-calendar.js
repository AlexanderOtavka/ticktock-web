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
      reflectToAttribute: true,
    },
    noMenu: Boolean,
  },

  toggleHide() {
    this.calendarHidden = !this.calendarHidden;
  },

  _getIcon(icon, calendarHidden) {
    return icon || (calendarHidden ? 'ticktock:calendar-hidden' :
                                     'ticktock:calendar');
  },

  _getHideButtonText(calendarHidden) {
    return calendarHidden ? 'Unhide' : 'Hide';
  },
});
