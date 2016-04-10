'use strict';

Polymer({
  is: 'calendar-selector',

  properties: {
    calendars: {
      type: Array,
      observer: '_reselect',
      value: () => [],
    },
    selectedCalendar: {
      type: Object,
      notify: true,
      readOnly: true,
    },
  },

  select(calendar) {
    let collection = Polymer.Collection.get(this.calendars);
    let newKey = collection.getKey(calendar);
    this._setSelectedCalendar(calendar);
    this.linkPaths('selectedCalendar', `calendars.${newKey}`);
  },

  _reselect() {
    this.select(this.selectedCalendar);
  },
});
