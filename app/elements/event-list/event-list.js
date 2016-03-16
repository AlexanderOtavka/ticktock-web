(function () {
'use strict';

Polymer({
  is: 'event-list',

  properties: {
    events: {
      type: Array,
      notify: true,
    },

    // TODO: make openedIndex change when order changes
    openedIndex: {
      type: Number,
      value: 0,
    },
    showHiddenEvents: Boolean,
    showHiddenCalendars: Boolean,
  },

  /**
   * Open an event by id.
   *
   * @param {String} eventId - The event's id.
   */
  openEvent(calendarId, eventId) {
    let eventIndex = this._getEventIndex(calendarId, eventId);
    if (eventIndex !== -1) {
      this.openedIndex = eventIndex;
    }
  },

  _isOpened(eventIndex, openedIndex) {
    return eventIndex === openedIndex;
  },

  _getEventIndex(calendarId, eventId) {
    return this.events.findIndex(calendarEvent =>
      calendarEvent.eventId === eventId &&
      calendarEvent.calendarId === calendarId
    );
  },

  _getDateInMs(dateString) {
    return Date.parse(dateString);
  },

  _getFilter(showHiddenEvents, showHiddenCalendars) {
    if (!showHiddenEvents && !showHiddenCalendars) {
      return calendarEvent => !calendarEvent.hidden &&
                              !calendarEvent.calendarHidden;
    } else if (!showHiddenEvents) {
      return calendarEvent => !calendarEvent.hidden;
    } else if (!showHiddenCalendars) {
      return calendarEvent => !calendarEvent.calendarHidden;
    } else {
      return null;
    }
  },

  _onEventOpenToggled(event) {
    if (event.detail.opened) {
      let old = this.$$('event-card[opened]');
      if (old) {
        old.toggleExpand();
      }

      this.openedIndex = event.model.index;
    } else {
      this.openedIndex = -1;
    }
  },
});

})();
