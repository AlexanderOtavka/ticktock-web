(function () {
'use strict';

//
// API configuration
//

GAPIManager.setClientId(
  '208366307202-00824keo9p663g1uhkd8misc52e1c5pa.apps.googleusercontent.com');
GAPIManager.setScopes([
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar.readonly',
]);

const LOCAL_API_ROOT = `//${window.location.host}/_ah/api`;
const ticktockAPILoaded = GAPIManager.loadAPI('ticktock', 'v1', LOCAL_API_ROOT);
const oauth2APILoaded = GAPIManager.loadAPI('oauth2', 'v2');

//
// Constants
//

const SIGNED_OUT_USER_INFO = {
  name: 'Sign In with Google',
  picture: '/images/google-logo.svg',
  loading: false,
  signedOut: true,
};
const LOADING_USER_INFO = {
  name: 'Loading...',
  picture: '',
  loading: true,
  signedOut: false,
};

const ALL_CALENDAR = {
  name: 'All Calendars',
  calendarId: '*',
  color: '#e91e63',
  icon: 'ticktock:calendar-multiple',
  noMenu: true,
  eventsErrored: false,
  eventsLoading: true,
  calendarErrored: false,
  calendarLoading: false,
  hidden: false,
  events: [],
  nextPageToken: null,
};

//
// Static Variables
//

// TODO: abstract away mutation with classes
let _calendars = [ALL_CALENDAR];

let _calendarsLoading = true;

//
// Element declaration
//

Polymer({
  is: 'api-manager',

  properties: {
    userInfo: {
      type: Object,
      notify: true,
      value: LOADING_USER_INFO,
    },
    calendars: {
      type: Object,
      notify: true,
      value: () => [ALL_CALENDAR],
    },
    hasHiddenCalendars: {
      type: Boolean,
      notify: true,
      readOnly: true,
      value: false,
    },
    showHiddenEvents: {
      type: Boolean,
    },
    showHiddenCalendars: {
      type: Boolean,
      observer: '_filterCalendars',
    },
    search: {
      type: String,
      observer: '_searchChanged',
      value: null,
    },
  },

  observers: [
    '_calendarsChanged(calendars.*)',
  ],

  //
  // Public api
  //

  /**
   * Authenticate the user and do an initial load.
   *
   * @param {Boolean} mode - True suppresses the popup and uses the cookie.
   * @return {Promise} - Promise that resolves on success.
   */
  signIn(mode) {
    return this._authorize(mode)
      .then(() => this._loadAllData());
  },

  /**
   * Remove all signed in UI.
   *
   * @return {Promise} - Promise that resolves on success.
   */
  signOut() {
    this.userInfo = SIGNED_OUT_USER_INFO;
    this.calendars = [];

    // TODO: actually sign the user out
    return Promise.resolve();
  },

  /**
   * Clear cache and reload events for given calendar.
   *
   * @param {Object} calendar - Calendar data object to be reloaded.
   * @return {Promise} - Promise that resolves to the new event list.
   */
  reloadEvents(calendar) {
    if (calendar.calendarErrored ||
        calendar.eventsLoading ||
        this.userInfo.signedOut) {
      return;
    }

    let calendars;
    if (calendar === ALL_CALENDAR) {
      calendars = this.calendars.slice();
      let i = calendars.findIndex(calendar => calendar === ALL_CALENDAR);
      calendars.splice(i, 1);
    } else {
      calendars = [calendar];
    }

    return this._loadEvents(calendars);
  },

  /**
   * Load the next page for a given calendar.
   *
   * @param {Object} calendar - Calendar data object whose next page will be
   *   loaded.
   * @return {Promise} - Promise that resolves to the new event list.
   */
  loadNextEvents(calendar) {
    if (calendar.calendarErrored ||
        calendar.eventsLoading ||
        this.userInfo.signedOut) {
      return;
    }

    // TODO: implement loading of next page
    console.log(
      `Loading next page for calendar with id = ${calendar.calendarId}`);

    let calendarKey = this._getCalendarKey(calendar);
    if (calendarKey) {
      this.set(['calendars', calendarKey, 'eventsLoading'], true);
    }

    // This promise will be pending forever
    return new Promise(() => {});
  },

  /**
   * Update event's data on the server.
   *
   * @param {Object} params - Calendar and event ids as well as new starred
   *   and/or hidden state.
   * @return {Promise} - Promise that resolves to the new event state.
   */
  patchEvent({ calendarId, eventId, starred, hidden }) {
    this._singleSortEvent(eventId, calendarId);

    let apiRequest = ticktockAPILoaded
      .then(ticktock => ticktock.events.patch({
        calendarId: encodeURIComponent(calendarId),
        eventId,
        starred,
        hidden,
      }));

    return this._sendReAuthedRequest(apiRequest)
      .catch(err => this._handleHTTPError(err));
  },

  /**
   * Update calendar's data on the server.
   *
   * @param {Object} params - Calendar id and new hidden state.
   * @return {Promise} - Promise that resolves to the new calendar state.
   */
  patchCalendar({ calendarId, hidden }) {
    let calendar = this.getCalendarById(calendarId);
    let calendarKey = this._getCalendarKey(calendar);
    let allCalendarKey = this._getCalendarKey(ALL_CALENDAR);

    ALL_CALENDAR.events.forEach((calendarEvent, i) => {
      if (calendarEvent.calendarId === calendar.calendarId) {
        this.set(['calendars', allCalendarKey, 'events', i, 'calendarHidden'],
                 calendarEvent.calendarHidden);
      }
    });

    if (calendarKey) {
      calendar.events.forEach((calendarEvent, i) => {
        this.notifyPath(
          ['calendars', calendarKey, 'events', i, 'calendarHidden'],
          calendar.hidden);
      });
    }

    let apiRequest = ticktockAPILoaded
      .then(ticktock => ticktock.calendars.patch({
        calendarId: encodeURIComponent(calendarId),
        hidden,
      }));

    return this._sendReAuthedRequest(apiRequest)
      .catch(err => this._handleHTTPError(err));
  },

  getCalendarById(calendarId) {
    let foundCalendar = _calendars.find(calendar =>
      calendar.calendarId === calendarId
    );

    return foundCalendar || this._makeProxyCalendar(calendarId);
  },

  deleteEventById(calendarId, eventId) {
    let calendar = this.getCalendarById(calendarId);

    {
      let i = getEventIndexById(calendar, eventId);
      if (i !== -1) {
        let calendarKey = this._getCalendarKey(calendar);
        this.splice(['calendars', calendarKey, 'events'], i, 1);
      }
    }

    {
      let i = getEventIndexById(ALL_CALENDAR, eventId, calendarId);
      if (i !== -1) {
        let calendarKey = this._getCalendarKey(ALL_CALENDAR);
        this.splice(['calendars', calendarKey, 'events'], i, 1);
      }
    }
  },

  //
  // Observers
  //

  _filterCalendars() {
    if (this.showHiddenCalendars) {
      this.calendars = _calendars;
    } else {
      this.calendars = _calendars.filter(calendar =>
        !calendar.hidden
      );
    }
  },

  _searchChanged(newSearch) {
    // TODO: implement search filtering
    console.log(`search changed to "${newSearch}"`);
    if (newSearch) {
      console.log('running clientside search (not really)');
    } else if (newSearch === '') {
      console.log('clearing event lists (not really)');
    } else if (newSearch === null) {
      console.log('removing search filter (not really)');
    }
  },

  _calendarsChanged(changeRecord) {
    let allCalendarIndex = this.calendars.indexOf(ALL_CALENDAR);
    let calendarsSplicesRE = new RegExp('^calendars$');
    let calendarHiddenRE =
      new RegExp(`^calendars\\.#(?!${allCalendarIndex})\\d+\\.hidden$`);

    if (calendarsSplicesRE.test(changeRecord.path) ||
        calendarHiddenRE.test(changeRecord.path)) {
      this._updateAllCalendarState();
    }

    if (calendarHiddenRE.test(changeRecord.path)) {
      this._filterCalendars();
    }
  },

  //
  // Utility methods
  //

  _getCalendarKey(calendar) {
    return Polymer.Collection.get(this.calendars).getKey(calendar);
  },

  _authorize(mode) {
    return GAPIManager.authorize(mode)
      .then(() => {
        this.userInfo = LOADING_USER_INFO;
      })
      .catch(err => {
        if (err instanceof GAPIManager.AuthError && err.accessDenied) {
          this.signOut();
        }

        throw err;
      });
  },

  _loadAllData() {
    return Promise.all([
      this._loadProfile()
        .catch(err => this._handleHTTPError(err)),
      this._loadCalendars()
        .then(calendars => this._loadEvents(calendars))
        .catch(err => this._handleHTTPError(err)),
    ]);
  },

  _loadProfile() {
    let apiRequest = oauth2APILoaded
      .then(oauth2 => oauth2.userinfo.v2.me.get({
        fields: 'name,picture',
      }));

    return this._sendReAuthedRequest(apiRequest)
      .then(resp => {
        resp.loading = false;
        resp.signedOut = false;
        this.userInfo = resp;
      });
  },

  _loadCalendars() {
    _calendarsLoading = true;
    let apiRequest = ticktockAPILoaded
      .then(ticktock => ticktock.calendars.list({
        hidden: null,
      }));

    return this._sendReAuthedRequest(apiRequest)
      .then(({ items: calendars = [] }) => {
        let hasHiddenCalendars = false;
        calendars.forEach((calendar, i) => {
          let duplicateKey;
          let duplicateIndex = _calendars.findIndex(loadingCalendar =>
            loadingCalendar.calendarId === calendar.calendarId
          );

          if (duplicateIndex !== -1) {
            let duplicate = _calendars.splice(duplicateIndex, 1)[0];
            duplicateKey = this._getCalendarKey(duplicate);
            updateObject(duplicate, calendar);
            calendar = duplicate;
            calendars.splice(i, 1, calendar);
          }

          calendar.calendarErrored = false;
          calendar.calendarLoading = false;
          calendar.icon = '';
          calendar.noMenu = false;

          addObjectFields(calendar, {
            events: [],
            eventsErrored: false,
            eventsLoading: false,
            nextPageToken: null,
          });

          if (calendar.hidden) {
            hasHiddenCalendars = true;
          }

          if (duplicateKey) {
            Object.keys(calendar).forEach(key => {
              this.notifyPath(['calendars', duplicateKey, key], calendar[key]);
            });
          }
        });

        this._setHasHiddenCalendars(hasHiddenCalendars);

        _calendarsLoading = false;
        _calendars.forEach(calendar => {
          if (calendar.calendarLoading) {
            setCalendarToErrorState(calendar);
          }
        });

        _calendars = _calendars.concat(calendars);
        this._filterCalendars();

        return calendars;
      });
  },

  _loadEvents(calendars) {
    let timeZone;
    try {
      timeZone =  Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (err) {
      timeZone = null;
    }

    let promise = Promise.all(calendars.map(calendar => {
      let calendarKey = this._getCalendarKey(calendar);
      if (calendarKey) {
        this.set(['calendars', calendarKey, 'events'], []);
        this.set(['calendars', calendarKey, 'eventsErrored'], false);
        this.set(['calendars', calendarKey, 'eventsLoading'], true);
      }

      let apiRequest = ticktockAPILoaded
        .then(ticktock => ticktock.events.list({
          calendarId: encodeURIComponent(calendar.calendarId),
          hidden: null,
          maxResults: 10,
          timeZone: timeZone,
        }));

      return this._sendReAuthedRequest(apiRequest)
        .then(({ items, nextPageToken = null }) => {
          calendarKey = this._getCalendarKey(calendar);

          calendar.nextPageToken = nextPageToken;
          if (calendarKey) {
            this.notifyPath(['calendars', calendarKey, 'nextPageToken'],
                            calendar.nextPageToken);
          }

          if (items) {
            items.forEach(calendarEvent => {
              calendarEvent.color = calendar.color;
              calendarEvent.calendarHidden = calendar.hidden;
            });

            calendar.events = items;
            if (calendarKey) {
              this.notifyPath(['calendars', calendarKey, 'events'], items);
            }

            sortEvents(calendar);
          }
        })
        .catch(err => {
          if (calendarKey) {
            this.set(['calendars', calendarKey, 'eventsErrored'], true);
          }

          throw err;
        })
        .catch(err => this._handleHTTPError(err))
        .then(() => {
          if (calendarKey) {
            this.set(['calendars', calendarKey, 'eventsLoading'], false);
          }
        });
    }))
      .then(() => this._updateAllCalendarState());

    this._updateAllCalendarState();

    return promise;
  },

  _updateAllCalendarState() {
    let calendars = this.calendars.slice();
    let allCalendarIndex = calendars.indexOf(ALL_CALENDAR);
    calendars.splice(allCalendarIndex, 1);

    let eventsLoading = (this.calendars.length - 1) ? false : _calendarsLoading;
    let eventsErrored = (this.calendars.length - 1) ? true : false;
    calendars.forEach(calendar => {
      if (calendar !== ALL_CALENDAR) {
        if (calendar.eventsLoading) {
          eventsLoading = true;
        }

        if (!calendar.eventsErrored) {
          eventsErrored = false;
        }
      }
    });

    if (eventsLoading) {
      eventsErrored = false;
    }

    this.set(['calendars', allCalendarIndex, 'eventsLoading'], eventsLoading);
    this.set(['calendars', allCalendarIndex, 'eventsErrored'], eventsErrored);

    let smallestDate = '';
    calendars.forEach(calendar => {
      if (calendar.events.length && calendar.nextPageToken) {
        let lastEventDate = calendar.events[calendar.events.length - 1].endDate;
        if (compareDateStrings(lastEventDate, smallestDate) < 0 ||
            !smallestDate) {
          smallestDate = lastEventDate;
        }
      }
    });

    let events = [];
    calendars.forEach(calendar => {
      // TODO: record this index for use in grabbing the next page
      calendar.events.findIndex(calendarEvent => {
        if (compareDateStrings(calendarEvent.endDate, smallestDate) > 0) {
          return true;
        } else {
          events.push(calendarEvent);
          return false;
        }
      });
    });

    events = events.sort(compareEvents);
    this.set(['calendars', allCalendarIndex, 'events'], events);
  },

  _handleHTTPError(err) {
    if (err instanceof GAPIManager.HTTPError) {
      console.warn(err);
      if (err.code === -1) {
        this.fire('network-error');
      } else if (err.code === 401) {
        this.signOut();
      } else {
        this.fire('error');
      }
    } else {
      throw err;
    }
  },

  _sendReAuthedRequest(request) {
    return request
      .catch(err => {
        if (err.code === 401) {
          console.warn(err);
          return this.signIn(true)
            .then(() => request);
        } else {
          throw err;
        }
      });
  },

  /**
   * Move an event to its proper place in its calendar and the ALL_CALENDAR.
   *
   * Uses the insertion sort algorithm, and notifies splices.
   *
   * @param {String} eventId - The event's ID.
   * @param {String} calendarId - The event's calendar's ID.
   */
  _singleSortEvent(eventId, calendarId) {
    let calendar = this.getCalendarById(calendarId);
    this._singleSortByCalendar(calendar, eventId);
    if (calendar !== ALL_CALENDAR) {
      this._singleSortByCalendar(ALL_CALENDAR, eventId);
    }
  },

  _singleSortByCalendar(calendar, eventId) {
    /************************
    Algorithm Summary Drawing
    *************************
                  *-3
    [1, 6, 9, 15, 19, 22]
        ^
    (1, 3)? yes
       (6, 3)? no

    [1, 6, 9, 15, 3, 19, 22]
            - to -
    [1, 3, 6, 9, 15, 19, 22]
    -----------------------------
        *-16
    [1, 9, 15, 17, 19, 22]
               ^
    (1, 16)? yes
       (9, 16)? yes
          (15, 16)? yes
              (17, 16)? no

    [1, 16, 9, 15, 17, 19, 22]
             - to -
    [1, 9, 15, 16, 17, 19, 22]
    ************************/
    let misplacedIndex = calendar.events.findIndex(calendarEvent =>
      calendarEvent.eventId === eventId
    );

    if (misplacedIndex === -1) {
      return;
    }

    let misplacedEvent = calendar.events.splice(misplacedIndex, 1)[0];

    let targetIndex = calendar.events.findIndex(calendarEvent =>
      compareEvents(calendarEvent, misplacedEvent) > 0
    );

    calendar.events.splice(targetIndex, 0, misplacedEvent);

    let calendarKey = this._getCalendarKey(calendar);
    if (calendarKey) {
      this.notifySplices(['calendars', calendarKey, 'events'], [
        {
          index: misplacedIndex,
          removed: [misplacedEvent],
          addedCount: 0,
          object: calendar.events,
          type: 'splice',
        },
        {
          index: targetIndex,
          removed: [],
          addedCount: 1,
          object: calendar.events,
          type: 'splice',
        },
      ]);
    }
  },

  _makeProxyCalendar(calendarId) {
    let proxy = {
      name: 'TickTock',
      calendarId: calendarId,
      color: '#e91e63',
      icon: '',
      noMenu: false,
      eventsErrored: false,
      eventsLoading: true,
      calendarErrored: false,
      calendarLoading: true,
      hidden: false,
      events: [],
      nextPageToken: null,
    };

    if (!_calendarsLoading) {
      setCalendarToErrorState(proxy);
    }

    _calendars.push(proxy);
    this.push('calendars', proxy);
    return proxy;
  },
});

//
// Utility functions
//

function getEventIndexById(calendar, eventId,
                           calendarId = calendar.calendarId) {
  return calendar.events.findIndex(calendarEvent =>
    calendarEvent.eventId === eventId &&
    calendarEvent.calendarId === calendarId
  );
}

function setCalendarToErrorState(calendar) {
  calendar.eventsErrored = true;
  calendar.eventsLoading = false;
  calendar.calendarErrored = true;
  calendar.calendarLoading = false;
}

/**
 * Sort all of a calendar's events.
 *
 * Does not notify.
 *
 * @param {Object} calendar - The calendar object whose events should be
 *   sorted.
 */
function sortEvents(calendar) {
  calendar.events = calendar.events.sort(compareEvents);
}

function compareBools(a, b) {
  // True is first.
  return b - a;
}

function compareStrings(a, b) {
  // Sort alphabetically, any language, case insensitive.
  return a.localeCompare(b);
}

function compareDateStrings(a, b) {
  return compareStrings(a, b);
}

function compareEvents(a, b) {
  // Sort order: starred, duration, alphabetical, id.
  return compareBools(a.starred, b.starred) ||
         compareDateStrings(a.startDate || a.endDate,
                            b.startDate || b.endDate) ||
         compareStrings(a.name, b.name) ||
         compareStrings(a.eventId, b.eventId) ||
         0;
}

function updateObject(object, newValues) {
  Object.keys(newValues).forEach(key => {
    object[key] = newValues[key];
  });
}

function addObjectFields(object, fields) {
  let keys = Object.keys(fields);
  keys.forEach(key => {
    if (!object.hasOwnProperty(key)) {
      object[key] = fields[key];
    }
  });
}

})();
