/* globals EventGroup, CalendarEventLine */

(function () {
'use strict';

class CalendarEventGroup extends EventGroup {
  constructor(manager, calendar, filters) {
    super(manager, calendar, filters);
    this._parent = null;
  }

  setParent(parent) {
    this._parent = parent;
  }

  sortEvent(calendarEvent) {
    super.sortEvent(calendarEvent);

    if (this._parent) {
      this._parent._performLineOp(line => line.sortEvent(calendarEvent));
    }
  }

  removeById(calendarId, eventId) {
    super.removeById(calendarId, eventId);

    if (this._parent) {
      this._parent._performLineOp(line => line.removeById(calendarId, eventId));
    }
  }

  _createEventLine(filters) {
    let { hidden, search } = filters;
    let line = new CalendarEventLine(this._calendar, filters);

    if (!search && hidden === false) {
      this._unhidden = line;
    } else if (!search && !hidden) {
      this._all = line;
    } else {
      this._virtual = line;
    }

    return line;
  }
}

window.CalendarEventGroup = CalendarEventGroup;

})();
