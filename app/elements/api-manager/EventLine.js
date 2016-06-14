/* globals Comparisons */

(function () {
'use strict';

const { compareEvents } = Comparisons;

const MAX_RESULTS = DEV ? 10 : 50;

class EventLine {
  constructor(calendar, { hidden, search }) {
    this._calendar = calendar;
    this._hidden = hidden;
    this._search = search;
    this._events = [];
    this._nextPageToken = null;
  }

  get events() {
    return this._events;
  }

  get filters() {
    return {
      hidden: this._hidden,
      search: this._search,
    };
  }

  hasFilters({ hidden, search }) {
    return this._hidden === hidden &&
           this._search === search;
  }

  loadNext(api) {
    let timeZone;
    try {
      timeZone =  Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {
      timeZone = null;
    }

    let apiRequest = api.events.list({
      calendarId: encodeURIComponent(this._calendar.calendarId),
      hidden: this._hidden,
      search: this._search,
      maxResults: MAX_RESULTS,
      timeZone,
    });

    return this._sendReAuthedRequest(apiRequest)
      .then(({ items: events, nextPageToken = null }) => {
        this._nextPageToken = nextPageToken;

        if (events) {
          let { color, hidden } = this._calendar;
          events.forEach(calendarEvent => {
            calendarEvent.color = color;
            calendarEvent.calendarHidden = hidden;
          });

          this._events.push(...events);
          return {
            events,
            splices: [
              {
                index: this._events.length - 1,
                removed: [],
                addedCount: events.length,
                object: this._events,
                type: 'splice',
              },
            ],
          };
        }
      });
  }

  sortEvent(misplacedEvent) {
    let misplacedIndex = this._events.indexOf(misplacedEvent);

    let splices;
    if (misplacedIndex !== -1) {
      this._events.splice(misplacedIndex, 1);
      splices = [
        {
          index: misplacedIndex,
          removed: [misplacedEvent],
          addedCount: 0,
          object: this._events,
          type: 'splice',
        },
      ];
    } else {
      splices = [];
    }

    let targetIndex = this._events.findIndex(calendarEvent =>
      compareEvents(calendarEvent, misplacedEvent) > 0
    );

    this._events.splice(targetIndex, 0, misplacedEvent);

    splices.push({
      index: targetIndex,
      removed: [],
      addedCount: 1,
      object: this._events,
      type: 'splice',
    });

    return splices;
  }

  removeById(calendarId, eventId) {
    let index = this._getEventIndex(calendarId, eventId);
    if (index !== -1) {
      let removed = this._events.splice(index, 1);
      return [
        {
          index,
          removed,
          addedCount: 0,
          object: this._events,
          type: 'splice',
        },
      ];
    } else {
      return [];
    }
  }

  _getEventIndex(calendarId, eventId) {
    return this._events.findIndex(calendarEvent =>
      calendarEvent.eventId === eventId &&
      calendarEvent.calendarId === calendarId
    );
  }
}

window.EventLine = EventLine;

})();
