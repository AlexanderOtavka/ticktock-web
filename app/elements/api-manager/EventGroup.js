(function () {
'use strict';

class EventGroup {
  constructor(manager, calendar, filters) {
    this.manager = manager;
    this._calendar = calendar;

    this._all = null;
    this._unhidden = null;
    this._virtual = null;
    this._activeLine = null;

    this.filter(filters);
  }

  get manager() {
    return this._manager;
  }

  set manager(manager) {
    this._manager = manager;
  }

  get events() {
    return this._activeLine.events;
  }

  get filters() {
    return this._activeLine.filters;
  }

  /**
   * Apply filters.
   *
   * @param {Object} filters
   */
  filter(filters) {
    this._activeLine = this._getEventLine(filters);
  }

  /**
   * Load the next page of events for the filters set.
   *
   * @return {Promise} - Resolves with newly loaded events.
   */
  loadNext(api) {
    let line = this._activeLine;
    return line.loadNext(api)
      .then(({ events, splices }) => {
        if (line === this._activeLine) {
          this._notifySplices(splices);
        }

        return events;
      });
  }

  /**
   * Move event to correct sorting position.
   *
   * @param {Object} calendarEvent
   */
  sortEvent(calendarEvent) {
    this._performLineOp(line => line.sortEvent(calendarEvent));
  }

  /**
   * Remove event from all lines and cache.
   *
   * @param {String} calendarId
   * @param {String} eventId
   */
  removeById(calendarId, eventId) {
    // it will probably be at the top, so indexOf is probably faster
    assert(this._calendar.calendarId === calendarId);
    this._performLineOp(line => line.removeById(calendarId, eventId));
  }

  _performLineOp(operation) {
    let splices;
    this._getLines().forEach(line => {
      if (!line) {
        return;
      }

      let s = operation(line);
      assert(s instanceof Array);
      if (line === this._activeLine) {
        splices = s;
      }
    });

    this._notifySplices(splices);
  }

  _notifySplices(splices) {
    if (!splices || !splices.length) {
      return;
    }

    let calendarKey = this.manager._getCalendarKey(this._calendar);
    this.manager.notifySplices(`calendars.${calendarKey}.events`, splices);
  }

  _getLines() {
    return [this._all, this._unhidden, this._virtual];
  }

  _getEventLine(filters) {
    let line = this._getLines().find(line =>
      line && line.hasFilters(filters)
    );

    if (!line) {
      line = this._createEventLine(filters);
    }

    return line;
  }

  /**
   * Create an event line for the given filters.
   *
   * @param {Object} filters
   */
  _createEventLine() {
    // Abstract
  }
}

window.EventGroup = EventGroup;

})();
