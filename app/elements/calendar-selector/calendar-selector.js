(function () {
'use strict';

class CalendarSelector {
  beforeRegister() {
    this.is = 'calendar-selector';

    this.properties = {
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
    };

    this.observers = [
      '_selectedHiddenChanged(selectedCalendar.hidden)',
    ];
  }

  select(calendar) {
    let collection = Polymer.Collection.get(this.calendars);
    let newKey = collection.getKey(calendar);
    this._setSelectedCalendar(calendar);
    this.linkPaths('selectedCalendar', 'calendars.' + newKey);
  }

  _selectedHiddenChanged(hidden) {
    this.fire('selected-hidden-changed', { value: hidden });
  }

  _reselect() {
    this.select(this.selectedCalendar);
  }
}

Polymer(CalendarSelector);

})();
